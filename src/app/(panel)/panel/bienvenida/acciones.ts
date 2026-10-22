"use server";

import { redirect } from "next/navigation";
import { condicionesAlDia, registrarAceptaciones } from "@/lib/auth/aceptaciones";
import { obtenerUsuario } from "@/lib/auth/sesion";
import { comprobarSlug } from "@/lib/datos/panel";
import { crearLocal } from "@/lib/datos/mutaciones";
import type { EstadoDireccion } from "@/componentes/panel-local/direccion";
import type { EstadoFormulario } from "@/lib/tipos/resultado";


/** Paso 1: guarda la aceptación de condiciones y privacidad y vuelve a cargar la bienvenida. */
export async function aceptarCondiciones(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (formData.get("acepto") !== "on") {
    return { ok: false, error: "datos_invalidos", campos: { acepto: "requerido" } };
  }
  const resultado = await registrarAceptaciones();
  if (!resultado.ok) return resultado;
  redirect("/panel/bienvenida");
}

/** Comprueba en directo si una dirección está libre (con sesión; formato y reservadas se miran antes). */
export async function comprobarDireccion(slug: string): Promise<EstadoDireccion> {
  if (typeof slug !== "string") return "formato";
  try {
    if (!(await obtenerUsuario())) return "error";
    const r = await comprobarSlug(slug.trim());
    return r.disponible ? "libre" : r.motivo;
  } catch (error) {
    console.error("comprobarDireccion:", error);
    return "error";
  }
}

/** Paso 2: crea el local y lleva al inicio del panel. */
export async function crearMiLocal(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (!(await condicionesAlDia())) redirect("/panel/bienvenida");
  const resultado = await crearLocal({
    nombre: String(formData.get("nombre") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  });
  if (!resultado.ok) return resultado;
  redirect(`/panel/${resultado.datos.localId}`);
}
