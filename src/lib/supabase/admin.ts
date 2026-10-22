import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave secreta: se salta RLS. SOLO servidor y solo para tareas
 * que no pueden hacerse como usuario (webhooks, tareas programadas).
 * Nunca lo uses para leer datos que luego se muestran sin comprobar permisos.
 */
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!clave) {
    throw new Error("Falta SUPABASE_SECRET_KEY en el entorno del servidor.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
