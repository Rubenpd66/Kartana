import { createBrowserClient } from "@supabase/ssr";

// Cliente para componentes de cliente (navegador). Usa solo la clave publicable.
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
