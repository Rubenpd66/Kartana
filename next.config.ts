import path from "node:path";
import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las respuestas.
// CSP mínima: sin nonces, para que las páginas públicas sigan siendo estáticas.
const cabecerasSeguridad = [
  {
    key: "Content-Security-Policy",
    value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Las fuentes de los PDF de QR se leen del disco: que Vercel las incluya en la función.
  outputFileTracingIncludes: { "/panel/[local]/qr/pdf": ["./src/lib/qr/fuentes/*.ttf"] },
  turbopack: {
    // Fija la raíz al proyecto (hay un package-lock.json suelto en la carpeta de usuario).
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
