import { NextResponse, type NextRequest } from "next/server";
import { validarSiguiente } from "@/lib/auth/redireccion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/** Vuelta de Google: canjea el código por la sesión (cookies) y lleva a `siguiente` (solo rutas internas). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const siguiente = validarSiguiente(searchParams.get("siguiente"));

  if (codigo && codigo.length <= 1024) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(siguiente, origin));
  }
  return NextResponse.redirect(new URL("/auth/error", origin));
}
