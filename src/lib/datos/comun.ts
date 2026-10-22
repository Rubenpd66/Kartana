import "server-only";
import type { CodigoError } from "@/lib/tipos/resultado";
import type { crearClienteServidor } from "@/lib/supabase/servidor";
import { COLUMNAS_LOCAL_PUBLICO, COLUMNAS_MENU_PUBLICO, COLUMNAS_PLATO_PUBLICO, COLUMNAS_SECCION_PUBLICA } from "./filas";

// Piezas compartidas por panel.ts, mutaciones.ts y admin.ts.

export type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;

/** Columnas completas que lee el dueño (las públicas + las internas). */
export const COLUMNAS_LOCAL = `${COLUMNAS_LOCAL_PUBLICO}, dueno_id, creado_en`;
export const COLUMNAS_SECCION = `${COLUMNAS_SECCION_PUBLICA}, creado_en`;
export const COLUMNAS_PLATO = `${COLUMNAS_PLATO_PUBLICO}, creado_en`;
export const COLUMNAS_MENU = `${COLUMNAS_MENU_PUBLICO}, creado_en`;

/** Id del usuario con sesión (getClaims, nunca getSession) o null. */
export async function idUsuario(supabase: ClienteSupabase): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const sub = data.claims.sub;
  return typeof sub === "string" && sub !== "" ? sub : null;
}

/** Error de PostgREST/Postgres (lo mínimo que usamos). */
export type ErrorBD = { code?: string; message?: string; details?: string } | null | undefined;

/**
 * Error de Postgres -> CodigoError.
 * - 23505 (único): slug ocupado si toca al slug; si no, conflicto.
 * - KL001 (trigger de límites): limite_alcanzado.
 * - 42501 (RLS o permisos): sin_permiso.
 * - 23503 (clave ajena: sección de otro local o que no existe): no_encontrado.
 * - 23514 / 22P02 / 22023 (CHECK, formato o parámetro): datos_invalidos.
 * - PGRST116 (ninguna fila con .single()): no_encontrado.
 */
export function traducirError(error: NonNullable<ErrorBD>): CodigoError {
  const texto = `${error.message ?? ""} ${error.details ?? ""}`;
  switch (error.code) {
    case "23505":
      return /slug/i.test(texto) ? "slug_ocupado" : "conflicto";
    case "KL001":
      return "limite_alcanzado";
    case "42501":
      return "sin_permiso";
    case "23503":
      return "no_encontrado";
    case "23514":
    case "22P02":
    case "22023":
      return "datos_invalidos";
    case "PGRST116":
      return "no_encontrado";
    default:
      return "error_servidor";
  }
}

/** Primer elemento si PostgREST devuelve una lista en un embebido uno a uno. */
export function unoODos<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}
