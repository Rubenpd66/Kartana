import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

// Solo zonas con sesión. Las cartas públicas (/c/...) y la web no pasan por aquí,
// para que sigan siendo estáticas, cacheables y sin cookies.
export const config = {
  matcher: ["/panel/:path*", "/admin/:path*", "/entrar/:path*", "/auth/:path*"],
};
