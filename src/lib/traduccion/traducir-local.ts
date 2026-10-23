import "server-only";
import { leerInterruptores } from "@/lib/config/interruptores";
import { revalidarCartaFueraDeAccion } from "@/lib/datos/cache";
import { obtenerLocalDelDueno } from "@/lib/datos/panel";
import { consumirCuotaTraduccion, guardarTraduccionesAuto, listarTextosTraducibles } from "@/lib/datos/traducciones";
import type { TraducirLocal } from "@/lib/tipos/contratos";
import type { IdiomaDestino } from "@/lib/tipos/dominio";
import type { Resultado } from "@/lib/tipos/resultado";
import type { Pendiente, ResultadoTraducirLocal, TraduccionAGuardar } from "@/lib/tipos/traduccion";
import { soloDestino } from "./estado";
import { ErrorTraduccion, traducirTextos } from "./google";
import { partirEnLotes } from "./lotes";
import { planificarTraducciones } from "./planificar";

// Traduce con Google lo que falta o está desactualizado de la carta de un local.
// - Usa la sesión del dueño (obtenerLocalDelDueno comprueba que el local es suyo).
// - Reserva cuota ANTES de cada petición: si no queda, para (cortadoPorCuota).
// - Guarda con guardar_traducciones_auto, que en SQL vuelve a proteger lo manual.
// - Nunca registra textos de la carta ni la clave: solo códigos de error.

const NADA: ResultadoTraducirLocal = { traducidos: 0, caracteres: 0, cortadoPorCuota: false };

function agruparPorIdioma(pendientes: Pendiente[]): Map<IdiomaDestino, Pendiente[]> {
  const grupos = new Map<IdiomaDestino, Pendiente[]>();
  for (const pendiente of pendientes) {
    const grupo = grupos.get(pendiente.idioma) ?? [];
    grupo.push(pendiente);
    grupos.set(pendiente.idioma, grupo);
  }
  return grupos;
}

function codigoParaRegistro(error: unknown): string {
  return error instanceof ErrorTraduccion ? error.message : "error_inesperado";
}

export const traducirLocal: TraducirLocal = async (localId) => {
  if (!leerInterruptores().traduccion) return { ok: false, error: "servicio_apagado" };

  const local = await obtenerLocalDelDueno(localId);
  if (!local) return { ok: false, error: "no_encontrado" };
  const idiomas = soloDestino(local.idiomasActivos as IdiomaDestino[]);
  if (idiomas.length === 0) return { ok: true, datos: NADA };

  const pendientes = planificarTraducciones(await listarTextosTraducibles(localId), idiomas);
  if (pendientes.length === 0) return { ok: true, datos: NADA };

  const progreso = { ...NADA };
  let fallo: Resultado<ResultadoTraducirLocal> | null = null;

  try {
    recorrer: for (const [idioma, grupo] of agruparPorIdioma(pendientes)) {
      for (const lote of partirEnLotes(grupo, (p) => p.original.length)) {
        const caracteres = lote.reduce((suma, p) => suma + p.original.length, 0);
        if (!(await consumirCuotaTraduccion(localId, caracteres))) {
          progreso.cortadoPorCuota = true;
          break recorrer;
        }
        progreso.caracteres += caracteres;

        const textos = await traducirTextos(
          lote.map((p) => p.original),
          idioma,
        );
        const aGuardar: TraduccionAGuardar[] = lote.map((p, i) => ({
          tabla: p.tabla,
          filaId: p.filaId,
          idioma: p.idioma,
          campo: p.campo,
          texto: textos[i]!,
          huella: p.huella,
          origen: "auto",
        }));
        const guardado = await guardarTraduccionesAuto(localId, aGuardar);
        if (!guardado.ok) {
          console.error("traducirLocal: no se pudo guardar", guardado.error);
          fallo = { ok: false, error: guardado.error };
          break recorrer;
        }
        progreso.traducidos += guardado.datos.guardadas;
      }
    }
  } catch (error) {
    console.error("traducirLocal:", codigoParaRegistro(error));
    fallo = { ok: false, error: "error_servidor" };
  }

  if (progreso.traducidos > 0) await revalidarCartaFueraDeAccion(localId);
  return fallo ?? { ok: true, datos: progreso };
};
