"use server";

import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth/sesion";
import { borrarMenu, guardarMenu, reordenar } from "@/lib/datos/mutaciones";
import type { EntradaMenu } from "@/lib/tipos/carta";
import type { Resultado } from "@/lib/tipos/resultado";

// Acciones de los menús del día. Comprueban la sesión; la mutación valida con Zod y escribe con RLS.

const SIN_SESION = { ok: false, error: "no_autenticado" } as const;

async function haySesion(): Promise<boolean> {
  return (await obtenerUsuario()) !== null;
}

/** Crea o edita un menú. Si sale bien, vuelve a la lista. */
export async function accionGuardarMenu(entrada: EntradaMenu): Promise<Resultado<{ menuId: string }>> {
  if (!(await haySesion())) return SIN_SESION;
  const resultado = await guardarMenu(entrada);
  if (!resultado.ok) return resultado;
  // localId ya pasó por Zod (uuid) en guardarMenu.
  redirect(`/panel/${entrada.localId}/menu?guardado=${resultado.datos.menuId}`);
}

export async function accionBorrarMenu(localId: string, menuId: string): Promise<Resultado> {
  if (!(await haySesion())) return SIN_SESION;
  const resultado = await borrarMenu(localId, menuId);
  if (!resultado.ok) return resultado;
  redirect(`/panel/${localId}/menu?borrado=1`);
}

/** Nuevo orden de los menús del local (lista completa de ids). */
export async function accionOrdenarMenus(localId: string, ids: string[]): Promise<Resultado> {
  if (!(await haySesion())) return SIN_SESION;
  return reordenar({ localId, tabla: "menus", ids });
}
