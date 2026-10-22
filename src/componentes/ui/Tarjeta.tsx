import type { ElementType, ReactNode } from "react";

/**
 * Caja blanca con borde y sombra suave (estilo `.tarjeta` de las maquetas).
 * - `como`: etiqueta HTML (por defecto `section`). Pasa `aria-labelledby` si lleva título.
 * - `relleno`: "normal" (16 px) o "grande" (24 px).
 */
export function Tarjeta({
  children,
  como: Etiqueta = "section",
  relleno = "normal",
  className = "",
  ...resto
}: {
  children: ReactNode;
  como?: ElementType;
  relleno?: "normal" | "grande";
  className?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  id?: string;
}) {
  const padding = relleno === "grande" ? "p-6" : "p-4";
  return (
    <Etiqueta
      className={`rounded-[22px] border border-borde bg-superficie shadow-[0_1px_2px_rgb(31_26_23/6%),0_4px_16px_rgb(31_26_23/6%)] ${padding} ${className}`.trim()}
      {...resto}
    >
      {children}
    </Etiqueta>
  );
}
