import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Cliente con la sesión del usuario (cookies). Para componentes de servidor,
 * acciones de servidor y route handlers de zonas privadas. Respeta RLS.
 * Con Cache Components, quien lo use debe ir dentro de <Suspense>.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return almacen.getAll();
        },
        setAll(cookiesAPoner) {
          try {
            cookiesAPoner.forEach(({ name, value, options }) => almacen.set(name, value, options));
          } catch {
            // Llamado desde un componente de servidor: el proxy ya refresca la sesión.
          }
        },
      },
    },
  );
}

/**
 * Cliente anónimo sin cookies, para datos públicos (cartas) dentro de 'use cache'.
 * Respeta RLS como rol anon. No toca la sesión, así que se puede cachear.
 */
export function crearClientePublico() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
