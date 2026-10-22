import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Usuario } from "@/lib/tipos/cuentas";
import { esCorreoAdmin } from "./admin";
import { RUTA_POR_DEFECTO, validarSiguiente } from "./redireccion";

/**
 * Usuario de la petición actual (una sola lectura por petición gracias a React.cache).
 * Verifica el token con getClaims(); nunca usa getSession(). Debe llamarse dentro de <Suspense>.
 */
export const obtenerUsuario = cache(async (): Promise<Usuario | null> => {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string" || !claims.sub || claims.is_anonymous) return null;

  const correo = typeof claims.email === "string" ? claims.email : "";
  const esAdmin = claims.app_metadata?.rol === "admin" && esCorreoAdmin(correo, process.env.ADMIN_EMAILS);
  return { id: claims.sub, correo, esAdmin };
});

/** Usuario con sesión o redirección a /entrar?siguiente=<ruta>. */
export async function exigirUsuario(siguiente: string = RUTA_POR_DEFECTO): Promise<Usuario> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect(`/entrar?siguiente=${encodeURIComponent(validarSiguiente(siguiente))}`);
  return usuario;
}

/** Solo administradores; a cualquier otro le responde 404 (no revela que la página existe). */
export async function exigirAdmin(): Promise<Usuario> {
  const usuario = await obtenerUsuario();
  if (!usuario?.esAdmin) notFound();
  return usuario;
}
