import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada petición a zonas privadas y la pasa
 * al servidor y al navegador. No protege nada por sí solo: cada página y acción
 * vuelve a comprobar al usuario con getClaims() cerca de los datos.
 */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesAPoner, cabeceras) {
          cookiesAPoner.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookiesAPoner.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
          Object.entries(cabeceras).forEach(([clave, valor]) => respuesta.headers.set(clave, valor));
        },
      },
    },
  );

  // No poner código entre createServerClient y getClaims(): puede cerrar sesiones al azar.
  await supabase.auth.getClaims();

  return respuesta;
}
