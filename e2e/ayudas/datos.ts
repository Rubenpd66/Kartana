import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Datos de prueba con la sesión del dueño de pruebas (la RLS solo le deja tocar lo suyo).
// El local `e2e-prueba` se comparte con otros carriles: se comprueba su estado antes de usarlo y se deja como estaba.

export const SLUG_E2E = "e2e-prueba";
export const SESION_DUENO = "e2e/.auth/dueno.json";
export const hayCredenciales = !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;

let cliente: SupabaseClient | null = null;

export async function clienteDueno(): Promise<SupabaseClient> {
  if (cliente) return cliente;
  const nuevo = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Hasta 3 intentos: con muchas entradas seguidas Supabase a veces responde con un fallo pasajero.
  let ultimo = "";
  for (let intento = 0; intento < 3; intento++) {
    const { error } = await nuevo.auth.signInWithPassword({ email: process.env.E2E_EMAIL!, password: process.env.E2E_PASSWORD! });
    if (!error) break;
    ultimo = error.message;
    if (intento === 2) throw new Error(`No se pudo entrar con el dueño de pruebas: ${ultimo}`);
    await new Promise((r) => setTimeout(r, 1500 * (intento + 1)));
  }
  cliente = nuevo;
  return nuevo;
}

export async function idLocalDePruebas(): Promise<string> {
  const db = await clienteDueno();
  const { data, error } = await db.from("locales").select("id").eq("slug", SLUG_E2E).maybeSingle();
  if (error || !data) throw new Error(`Falta el local de pruebas «${SLUG_E2E}»`);
  return (data as { id: string }).id;
}

/** Publica el local si no lo está y devuelve cómo estaba, para restaurarlo después. */
export async function asegurarPublicado(localId: string): Promise<{ estabaPublicado: boolean }> {
  const db = await clienteDueno();
  const { data } = await db.from("locales").select("publicado").eq("id", localId).single();
  const estabaPublicado = !!(data as { publicado: boolean } | null)?.publicado;
  if (!estabaPublicado) await db.from("locales").update({ publicado: true }).eq("id", localId);
  return { estabaPublicado };
}

export async function restaurarPublicado(localId: string, estabaPublicado: boolean) {
  const db = await clienteDueno();
  await db.from("locales").update({ publicado: estabaPublicado }).eq("id", localId);
}

/** Borra lo que una ejecución creó con su prefijo (red de seguridad por si una prueba falla a medias). */
export async function limpiarPorPrefijo(localId: string, prefijo: string) {
  const db = await clienteDueno();
  await db.from("secciones").delete().eq("local_id", localId).like("nombre", `${prefijo}%`);
}
