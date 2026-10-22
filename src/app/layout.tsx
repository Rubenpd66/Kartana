import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { SITIO, urlSitio } from "@/lib/config/sitio";
import { comunEs as t } from "@/lib/i18n/comun.es";
import "./globals.css";

// Tipografías servidas desde la propia web (next/font las descarga en el build).
const fuenteTexto = Figtree({ variable: "--fuente-texto", subsets: ["latin"], display: "swap" });
const fuenteTitulo = Fraunces({ variable: "--fuente-titulo", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio()),
  title: { default: `${SITIO.nombre} · Carta digital con QR para bares`, template: `%s · ${SITIO.nombre}` },
  description: SITIO.descripcion,
  applicationName: SITIO.nombre,
  openGraph: { type: "website", locale: "es_ES", siteName: SITIO.nombre },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fuenteTexto.variable} ${fuenteTitulo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-superficie focus:px-4 focus:py-2"
        >
          {t.saltarAlContenido}
        </a>
        {children}
      </body>
    </html>
  );
}
