"use server";

import { refresh } from "next/cache";
import { obtenerUsuario } from "@/lib/auth/sesion";
import {
  actualizarIdiomasActivos,
  descartarTraduccionManual,
  guardarTraduccionManual,
  listarTextosTraducibles,
} from "@/lib/datos/traducciones";
import { obtenerLocalDelDueno } from "@/lib/datos/panel";
import { traducirLocal } from "@/lib/traduccion/traducir-local";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { IdiomaDestino } from "@/lib/tipos/dominio";
import type { EstadoFormulario, Resultado } from "@/lib/tipos/resultado";
import type { ResultadoTraducirLocal } from "@/lib/tipos/traduccion";
import { esquemaId } from "@/lib/validacion/comun";
import { esquemaDescartarTraduccion, esquemaTraduccionManual, IDIOMAS_DESTINO } from "@/lib/validacion/idiomas";
import { z } from "zod";

// La sesión se comprueba aquí; la validación de fondo (Zod) y los permisos (RLS + dueño) los repite la capa de datos.

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "");

async function protegido<T>(hacer: () => Promise<Resultado<T>>): Promise<EstadoFormulario<T>> {
  try {
    if (!(await obtenerUsuario())) return { ok: false, error: "no_autenticado" };
    const r = await hacer();
    if (r.ok) refresh();
    return r;
  } catch (error) {
    console.error("panel-idiomas:", error);
    return { ok: false, error: "error_servidor" };
  }
}

export async function guardarIdiomasAccion(localId: string, _previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const idiomas = datos.getAll("idiomas").map(String);
  return protegido(() => actualizarIdiomasActivos({ localId, idiomas: idiomas as IdiomaCarta[] }));
}

export async function traducirAhoraAccion(
  localId: string,
  _previo: EstadoFormulario<ResultadoTraducirLocal>,
): Promise<EstadoFormulario<ResultadoTraducirLocal>> {
  if (!esquemaId.safeParse(localId).success) return { ok: false, error: "datos_invalidos" };
  return protegido(() => traducirLocal(localId));
}

function camposTraduccion(datos: FormData) {
  return {
    localId: texto(datos, "localId"),
    tabla: texto(datos, "tabla"),
    filaId: texto(datos, "filaId"),
    campo: texto(datos, "campo"),
    idioma: texto(datos, "idioma"),
  };
}

export async function guardarTraduccionAccion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const v = esquemaTraduccionManual.safeParse({ ...camposTraduccion(datos), texto: texto(datos, "texto") });
  if (!v.success) return { ok: false, error: "datos_invalidos" };
  return protegido(() => guardarTraduccionManual(v.data));
}

export async function descartarTraduccionAccion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const v = esquemaDescartarTraduccion.safeParse(camposTraduccion(datos));
  if (!v.success) return { ok: false, error: "datos_invalidos" };
  return protegido(() => descartarTraduccionManual(v.data));
}

const esquemaMantener = z.object({
  localId: esquemaId,
  tabla: z.enum(["secciones", "platos", "menus"]),
  filaId: esquemaId,
});

/** Guarda el nombre en español como corrección propia en todos los idiomas activos (p. ej. «Ajo mataero»). */
export async function mantenerOriginalAccion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const v = esquemaMantener.safeParse(camposTraduccion(datos));
  if (!v.success) return { ok: false, error: "datos_invalidos" };
  const { localId, tabla, filaId } = v.data;
  return protegido(async () => {
    const local = await obtenerLocalDelDueno(localId);
    if (!local) return { ok: false, error: "no_encontrado" };
    const textos = await listarTextosTraducibles(localId);
    const original = textos.find((t) => t.tabla === tabla && t.filaId === filaId && t.campo === "nombre")?.original;
    if (!original) return { ok: false, error: "no_encontrado" };
    const destinos = IDIOMAS_DESTINO.filter((i): i is IdiomaDestino => local.idiomasActivos.includes(i));
    for (const idioma of destinos) {
      const r = await guardarTraduccionManual({ localId, tabla, filaId, campo: "nombre", idioma, texto: original });
      if (!r.ok) return r;
    }
    return { ok: true, datos: undefined };
  });
}
