import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/**
 * Cierra la sesión de este dispositivo (scope "local": no echa al dueño de su móvil si sale en el ordenador).
 * Solo POST (formulario con botón «Salir»); 303 para que el navegador vaya a / con GET.
 */
export async function POST(request: NextRequest) {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
}
