import type { ReactNode } from "react";

export type VarianteInsignia = "neutra" | "exito" | "aviso" | "peligro";

const ESTILOS: Record<VarianteInsignia, string> = {
  neutra: "bg-superficie-suave text-texto-suave",
  exito: "border border-exito/40 bg-superficie text-exito",
  aviso: "border border-aviso/40 bg-superficie text-aviso",
  peligro: "border border-peligro/40 bg-superficie text-peligro",
};

/**
 * Etiqueta pequeña de estado («Publicada», «Agotado», «Prueba: 23 días»).
 * - `variante`: neutra | exito | aviso | peligro. El texto siempre dice el estado (no solo el color).
 */
export function Insignia({
  children,
  variante = "neutra",
  className = "",
}: {
  children: ReactNode;
  variante?: VarianteInsignia;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold ${ESTILOS[variante]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
