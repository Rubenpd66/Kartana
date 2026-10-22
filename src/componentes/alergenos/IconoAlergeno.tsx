// Icono de un alérgeno: SVG en línea, 24×24, un solo color (hereda `currentColor`).
// Componente de servidor: sin estado, sin JavaScript. Se puede usar también desde componentes de cliente.

import type { PropsIconoAlergeno } from "@/lib/tipos/contratos";
import { TRAZOS } from "./trazos";

export function IconoAlergeno({ codigo, tamano = 24, titulo, className }: PropsIconoAlergeno) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titulo ? "img" : undefined}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      {titulo ? <title>{titulo}</title> : null}
      {TRAZOS[codigo].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
