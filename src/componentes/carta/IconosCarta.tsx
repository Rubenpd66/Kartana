import { TRAZOS } from "@/componentes/alergenos/trazos";
import { ALERGENOS } from "@/lib/dominio/alergenos";
import type { CodigoAlergeno } from "@/lib/tipos/dominio";

// Los mismos iconos que IconoAlergeno (mismos trazos), pero dibujados UNA vez por página como <symbol>
// y reutilizados con <use>. Una carta tiene cientos de iconos: así el HTML pesa y cuesta mucho menos
// (cada icono son 2 nodos en vez de 1 + sus caminos), sin JavaScript.

const idSimbolo = (codigo: CodigoAlergeno) => `al-${codigo}`;

/** Definiciones de los 14 iconos. Va una sola vez, dentro de la carta. */
export function SpriteAlergenos() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
      {ALERGENOS.map((codigo) => (
        <symbol key={codigo} id={idSimbolo(codigo)} viewBox="0 0 24 24">
          {TRAZOS[codigo].map((d, i) => (
            <path key={i} d={d} />
          ))}
        </symbol>
      ))}
    </svg>
  );
}

/** Un icono de alérgeno decorativo (el nombre va siempre en texto al lado). Necesita <SpriteAlergenos /> en la página. */
export function IconoCarta({ codigo, tamano = 20 }: { codigo: CodigoAlergeno; tamano?: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="flex-none"
    >
      <use href={`#${idSimbolo(codigo)}`} />
    </svg>
  );
}
