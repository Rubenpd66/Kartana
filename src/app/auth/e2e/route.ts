import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// SOLO PRUEBAS DE NAVEGADOR. Inicia sesión con un usuario de prueba y deja las cookies.
// Responde 404 salvo que E2E_ACCESO === "true", la app NO corra en Vercel y la petición llegue a localhost.

const esquema = z.object({ quien: z.enum(["dueno", "admin"]) }).strict();
const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function noExiste() {
  return new NextResponse(null, { status: 404 });
}

export async function POST(request: NextRequest) {
  if (process.env.E2E_ACCESO !== "true" || process.env.VERCEL) return noExiste();
  if (!HOSTS_LOCALES.has(request.nextUrl.hostname)) return noExiste();

  const cuerpo = esquema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return new NextResponse(null, { status: 400 });

  // Credenciales siempre del entorno, nunca del cuerpo.
  const email = cuerpo.data.quien === "admin" ? process.env.E2E_ADMIN_EMAIL : process.env.E2E_EMAIL;
  const password = cuerpo.data.quien === "admin" ? process.env.E2E_ADMIN_PASSWORD : process.env.E2E_PASSWORD;
  if (!email || !password) return noExiste();

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return new NextResponse(null, { status: 401 });
  return new NextResponse(null, { status: 204 });
}
