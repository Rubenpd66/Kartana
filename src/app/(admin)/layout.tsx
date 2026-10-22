import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { adminEs as t } from "@/lib/i18n/admin.es";

// Zona privada: nunca en buscadores. Sin lecturas de sesión aquí (la página las hace dentro de <Suspense>).
export const metadata: Metadata = { title: t.meta.titulo, robots: { index: false, follow: false } };

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="bg-texto text-fondo">
        <Contenedor ancho="ancho" className="flex h-14 items-center justify-between gap-4">
          <span className="font-titulo text-xl font-semibold">{t.barra.marca}</span>
          <Link href="/panel" className="inline-flex min-h-12 items-center text-fondo underline">
            {t.barra.irAlPanel}
          </Link>
        </Contenedor>
      </header>
      <main id="contenido" className="flex-1">
        {children}
      </main>
    </>
  );
}
