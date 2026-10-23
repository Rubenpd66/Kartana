"use server";

import { redirect } from "next/navigation";
import { leerFormularioPlato } from "@/componentes/panel-carta/formulario-plato";
import { obtenerUsuario } from "@/lib/auth/sesion";
import { borrarPlato, borrarSeccion, cambiarAgotado, guardarPlato, guardarSeccion, reordenar } from "@/lib/datos/mutaciones";
import type { EntradaAgotado, EntradaOrden, EntradaSeccion } from "@/lib/tipos/carta";
import type { Resultado } from "@/lib/tipos/resultado";

// Acciones de servidor de la carta del panel. Cada una comprueba la sesión aquí y la mutación
// vuelve a validar con Zod, comprueba la sesión (getClaims) y escribe con RLS (solo lo del dueño).

const SIN_SESION = { ok: false, error: "no_autenticado" } as const;

async function haySesion(): Promise<boolean> {
  return (await obtenerUsuario()) !== null;
}

/** Crea o edita un plato desde el formulario del editor. Si sale bien, vuelve a la lista. */
export async function accionGuardarPlato(fd: FormData): Promise<Resultado<{ platoId: string }>> {
  if (!(await haySesion())) return SIN_SESION;
  const { entrada, errores } = leerFormularioPlato(fd);
  if (Object.keys(errores).length > 0) return { ok: false, error: "datos_invalidos", campos: errores };
  const resultado = await guardarPlato(entrada);
  if (!resultado.ok) return resultado;
  // localId y platoId ya pasaron por Zod en guardarPlato (uuid): es seguro ponerlos en la URL.
  redirect(`/panel/${entrada.localId}/carta?guardado=${resultado.datos.platoId}`);
}

export async function accionBorrarPlato(localId: string, platoId: string): Promise<Resultado> {
  if (!(await haySesion())) return SIN_SESION;
  const resultado = await borrarPlato(localId, platoId);
  if (!resultado.ok) return resultado;
  redirect(`/panel/${localId}/carta?borrado=1`);
}

export async function accionCambiarAgotado(entrada: EntradaAgotado): Promise<Resultado> {
  if (!(await haySesion())) return SIN_SESION;
  return cambiarAgotado(entrada);
}

export async function accionReordenar(entrada: EntradaOrden): Promise<Resultado> {
  if (!(await haySesion())) return SIN_SESION;
  return reordenar(entrada);
}

export async function accionGuardarSeccion(entrada: EntradaSeccion): Promise<Resultado<{ seccionId: string }>> {
  if (!(await haySesion())) return SIN_SESION;
  return guardarSeccion(entrada);
}

export async function accionBorrarSeccion(localId: string, seccionId: string): Promise<Resultado> {
  if (!(await haySesion())) return SIN_SESION;
  return borrarSeccion(localId, seccionId);
}
