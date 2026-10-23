import "server-only";
import { obtenerUsuario } from "@/lib/auth/sesion";
import { urlSitio } from "@/lib/config/sitio";
import { obtenerLocalDelDueno } from "@/lib/datos/panel";
import { rutaCarta } from "@/lib/i18n/idiomas";
import type { Local } from "@/lib/tipos/carta";

const SIN_CACHE = { "Cache-Control": "private, no-store" };

export function respuestaError(estado: 400 | 401 | 404 | 500, error: string): Response {
  return Response.json({ error }, { status: estado, headers: SIN_CACHE });
}

/** Dirección pública de la carta: lo que lleva el QR. */
export function urlDeLaCarta(slug: string): string {
  return urlSitio() + rutaCarta(slug);
}

/**
 * Comprueba la sesión (401) y que el local es del usuario (404). Nunca usa la clave de administración.
 * Para los route handlers de descarga de este módulo.
 */
export async function localDelDuenoOError(localId: string): Promise<{ local: Local } | { error: Response }> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: respuestaError(401, "no_autenticado") };
  const local = await obtenerLocalDelDueno(localId);
  if (!local) return { error: respuestaError(404, "no_encontrado") };
  return { local };
}

export const CABECERAS_DESCARGA = SIN_CACHE;
