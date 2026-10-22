import type { ElementType, ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** "estrecho" (640 px): panel y carta. "ancho" (1120 px): web de venta. */
  ancho?: "estrecho" | "ancho";
  como?: ElementType;
  className?: string;
};

/** Único sitio donde se fija el ancho máximo de página. No repitas max-w-* en otros archivos. */
export function Contenedor({ children, ancho = "ancho", como: Etiqueta = "div", className = "" }: Props) {
  const maximo = ancho === "estrecho" ? "max-w-estrecho" : "max-w-ancho";
  return <Etiqueta className={`mx-auto w-full ${maximo} px-4 sm:px-6 ${className}`}>{children}</Etiqueta>;
}
