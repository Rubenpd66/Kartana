import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BarraPanel } from "@/componentes/panel/BarraPanel";

// Zona privada: nunca en buscadores. Sin lecturas de sesión aquí (cada página la comprueba dentro de <Suspense>).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutPanel({ children }: { children: ReactNode }) {
  return (
    <>
      <BarraPanel />
      <main id="contenido" className="flex-1">
        {children}
      </main>
    </>
  );
}
