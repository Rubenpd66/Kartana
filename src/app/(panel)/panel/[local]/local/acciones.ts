"use server";

import { refresh } from "next/cache";
import type { EstadoDireccion } from "@/componentes/panel-local/direccion";
import { obtenerUsuario } from "@/lib/auth/sesion";
import { guardarHorarios, guardarLogo, actualizarLocal } from "@/lib/datos/mutaciones";
import { comprobarSlug, obtenerLocalDelDueno } from "@/lib/datos/panel";
import type { EntradaLocal } from "@/lib/tipos/carta";
import type { FranjaHoraria } from "@/lib/tipos/dominio";
import type { EstadoFormulario, Resultado } from "@/lib/tipos/resultado";

// Cada bloque de /panel/[local]/local se guarda por separado. actualizarLocal necesita todos los
// campos, así que cada acción lee el local actual (con la sesión del dueño) y cambia solo los suyos.
// La validación completa (Zod), la sesión y la caché las hace la mutación.

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "");

async function cambiarLocal(localId: string, cambios: Partial<Omit<EntradaLocal, "localId">>): Promise<Resultado> {
  const actual = await obtenerLocalDelDueno(localId);
  if (!actual) return { ok: false, error: "no_encontrado" };
  const r = await actualizarLocal({
    localId,
    nombre: actual.nombre,
    slug: actual.slug,
    descripcion: actual.descripcion,
    direccion: actual.direccion,
    telefono: actual.telefono,
    colorMarca: actual.colorMarca,
    permitirIndexar: actual.permitirIndexar,
    ...cambios,
  });
  if (r.ok) refresh();
  return r;
}

async function protegido(hacer: () => Promise<Resultado>): Promise<EstadoFormulario> {
  try {
    if (!(await obtenerUsuario())) return { ok: false, error: "no_autenticado" };
    return await hacer();
  } catch (error) {
    console.error("panel-local:", error);
    return { ok: false, error: "error_servidor" };
  }
}

export async function guardarDatos(localId: string, _previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  return protegido(() =>
    cambiarLocal(localId, {
      nombre: texto(datos, "nombre"),
      descripcion: texto(datos, "descripcion"),
      direccion: texto(datos, "direccion"),
      telefono: texto(datos, "telefono"),
      permitirIndexar: datos.get("permitirIndexar") === "on",
    }),
  );
}

export async function guardarDireccionCarta(localId: string, _previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  return protegido(() => cambiarLocal(localId, { slug: texto(datos, "slug") }));
}

export async function guardarColor(localId: string, _previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  return protegido(() => cambiarLocal(localId, { colorMarca: texto(datos, "colorMarca") }));
}

export async function guardarLogoDelLocal(localId: string, logoRuta: string | null): Promise<EstadoFormulario> {
  return protegido(async () => {
    const r = await guardarLogo({ localId, logoRuta });
    if (r.ok) refresh();
    return r;
  });
}

export async function guardarHorariosDelLocal(localId: string, horarios: FranjaHoraria[]): Promise<EstadoFormulario> {
  return protegido(async () => {
    const r = await guardarHorarios({ localId, horarios });
    if (r.ok) refresh();
    return r;
  });
}

/** Comprobación en directo de la dirección nueva del local: su propia dirección actual cuenta como libre. */
export async function comprobarDireccionDelLocal(localId: string, slug: string): Promise<EstadoDireccion> {
  if (typeof slug !== "string") return "formato";
  try {
    if (!(await obtenerUsuario())) return "error";
    const r = await comprobarSlug(slug.trim(), localId);
    return r.disponible ? "libre" : r.motivo;
  } catch (error) {
    console.error("comprobarDireccionDelLocal:", error);
    return "error";
  }
}
