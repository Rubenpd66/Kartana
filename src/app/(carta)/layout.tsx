import type { ReactNode } from "react";
import "./carta.css";

// Cartas públicas: sin cabecera ni pie de Kartana (la carta lleva los suyos con el color del bar).
// Sin cookies, sin sesión y sin scripts de terceros: el proxy no corre en /c/.
export default function LayoutCarta({ children }: { children: ReactNode }) {
  return (
    <main id="contenido" className="flex flex-1 flex-col">
      {children}
    </main>
  );
}
