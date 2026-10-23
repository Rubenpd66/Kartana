import "server-only";
import { esIdiomaCarta, type IdiomaCarta } from "@/lib/i18n/idiomas";
import { crearClientePublico, crearClienteServidor } from "@/lib/supabase/servidor";
import type { ObtenerResumenEstadisticas, RegistrarEvento } from "@/lib/tipos/contratos";
import type { DiaEstadistica, PlatoMasVisto } from "@/lib/tipos/estadisticas";
import { esquemaId } from "@/lib/validacion/comun";
import { esquemaEventoEstadistica } from "@/lib/validacion/idiomas";
import type { FilaEstadisticaDia, FilaPlatoMasVisto } from "./filas";

// Estadísticas anónimas (v0.2, docs/arquitectura.md §5.4). Sin cookies, sin IP, sin identificadores:
// solo contadores por día. Se escriben con la función SQL registrar_estadisticas (que comprueba todo).

const TOP_PLATOS = 10;

/**
 * Suma un evento de la carta pública (lo llama POST /api/e). Cliente público, sin sesión.
 * Nunca lanza: si algo falla se registra el fallo (sin datos del visitante ni del evento) y se sigue.
 */
export const registrarEvento: RegistrarEvento = async (evento) => {
  const validado = esquemaEventoEstadistica.safeParse(evento);
  if (!validado.success) return;
  try {
    const { tipo, localId, idioma, platos } = validado.data;
    const { error } = await crearClientePublico().rpc("registrar_estadisticas", {
      p_local: localId,
      p_tipo: tipo,
      p_idioma: idioma,
      p_platos: platos,
    });
    if (error) console.error("registrarEvento: fallo de la base de datos", error.code ?? "");
  } catch {
    console.error("registrarEvento: no se pudo registrar");
  }
};

// ---------------------------------------------------------------------------
// Resumen para el panel
// ---------------------------------------------------------------------------

/** "AAAA-MM-DD" de hoy en hora de Madrid. */
function hoyEnMadrid(ahora: Date): string {
  // en-CA da el formato AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

/** Suma `n` días a una fecha "AAAA-MM-DD" (aritmética en UTC: sin líos con el cambio de hora). */
function sumarDias(dia: string, n: number): string {
  const fecha = new Date(`${dia}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + n);
  return fecha.toISOString().slice(0, 10);
}

const entero = (v: unknown): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
};

function porIdioma(valor: unknown): Partial<Record<IdiomaCarta, number>> {
  const resultado: Partial<Record<IdiomaCarta, number>> = {};
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return resultado;
  for (const [idioma, n] of Object.entries(valor)) {
    if (esIdiomaCarta(idioma) && typeof n === "number" && Number.isFinite(n) && n > 0) resultado[idioma] = Math.trunc(n);
  }
  return resultado;
}


/**
 * Resumen de los últimos `dias` días (hoy incluido, hora de Madrid): un elemento por día (también los días a
 * cero), totales y los 10 platos más vistos. Con la sesión del dueño (la RLS solo deja ver lo suyo).
 * Quien lo llame debe estar dentro de <Suspense> y haber comprobado al usuario.
 */
export const obtenerResumenEstadisticas: ObtenerResumenEstadisticas = async (localId, dias) => {
  const hasta = hoyEnMadrid(new Date());
  const desde = sumarDias(hasta, -(dias - 1));
  const rango = Array.from({ length: dias }, (_, i) => sumarDias(desde, i));

  let filas: Array<Omit<FilaEstadisticaDia, "local_id">> = [];
  let top: FilaPlatoMasVisto[] = [];
  if (esquemaId.safeParse(localId).success) {
    const supabase = await crearClienteServidor();
    const [estadisticas, platos] = await Promise.all([
      supabase
        .from("estadisticas_dia")
        .select("dia, visitas, visitas_por_idioma, clics_resena")
        .eq("local_id", localId)
        .gte("dia", desde)
        .lte("dia", hasta),
      supabase.rpc("platos_mas_vistos", { p_local: localId, p_desde: desde, p_hasta: hasta, p_limite: TOP_PLATOS }),
    ]);
    if (estadisticas.error) throw new Error(`obtenerResumenEstadisticas: ${estadisticas.error.message}`);
    if (platos.error) throw new Error(`obtenerResumenEstadisticas: ${platos.error.message}`);
    filas = (estadisticas.data ?? []) as unknown as Array<Omit<FilaEstadisticaDia, "local_id">>;
    top = (platos.data ?? []) as unknown as FilaPlatoMasVisto[];
  }

  const porDia = new Map(filas.map((f) => [f.dia, f]));
  const listaDias: DiaEstadistica[] = rango.map((dia) => {
    const f = porDia.get(dia);
    return {
      dia,
      visitas: entero(f?.visitas),
      clicsResena: entero(f?.clics_resena),
      visitasPorIdioma: porIdioma(f?.visitas_por_idioma),
    };
  });
  const platosMasVistos: PlatoMasVisto[] = top
    .map((p) => ({ platoId: p.plato_id, nombre: p.nombre, vistas: entero(p.vistas) }))
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, TOP_PLATOS);

  return {
    desde,
    hasta,
    dias: listaDias,
    totalVisitas: listaDias.reduce((s, d) => s + d.visitas, 0),
    totalClicsResena: listaDias.reduce((s, d) => s + d.clicsResena, 0),
    platosMasVistos,
  };
};
