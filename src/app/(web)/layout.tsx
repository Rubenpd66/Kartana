import type { ReactNode } from "react";
import { Cabecera } from "@/componentes/Cabecera";
import { Pie } from "@/componentes/Pie";

export default function LayoutWeb({ children }: { children: ReactNode }) {
  return (
    <>
      <Cabecera />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Pie />
    </>
  );
}
