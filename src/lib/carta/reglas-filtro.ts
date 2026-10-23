// Reglas CSS del filtro de alérgenos (funciona sin JavaScript, con :has()).
// `src/app/(carta)/carta.css` lleva este mismo texto entre las marcas INICIO/FIN; un test comprueba que coinciden.
// Si cambias algo aquí, copia la salida de `reglasFiltroAlergenos()` en carta.css.

import { ALERGENOS } from "@/lib/dominio/alergenos";
import type { CodigoAlergeno } from "@/lib/tipos/dominio";

export const MARCA_INICIO = "/* === INICIO reglas del filtro (generadas por src/lib/carta/reglas-filtro.ts) === */";
export const MARCA_FIN = "/* === FIN reglas del filtro === */";

/** Id de la casilla de un alérgeno en el filtro. */
export const idCasilla = (codigo: CodigoAlergeno): string => `f-${codigo}`;
export const ID_TRAZAS = "f-trazas";
/** `name` de las 14 casillas de alérgenos (la de trazas no lo lleva: sola no filtra nada). */
export const NOMBRE_CASILLA = "al";

/** CSS de las reglas del filtro para los 14 alérgenos, con las marcas de inicio y fin. */
export function reglasFiltroAlergenos(codigos: readonly CodigoAlergeno[] = ALERGENOS): string {
  const ocultar = codigos.map((c) => `.carta:has(#${idCasilla(c)}:checked) .plato[data-alergenos~="${c}"]`);
  const trazas = codigos.map(
    (c) => `.carta:has(#${ID_TRAZAS}:checked):has(#${idCasilla(c)}:checked) .plato[data-trazas~="${c}"]`,
  );
  const activo = `.carta:has(.filtro input[name="${NOMBRE_CASILLA}"]:checked)`;
  return [
    MARCA_INICIO,
    `${ocultar.join(",\n")} {\n  display: none;\n}`,
    `${trazas.join(",\n")} {\n  display: none;\n}`,
    `${activo} .plato[data-confirmado="no"] .sin-info {\n  display: block;\n}`,
    `${activo} .filtro-activo {\n  display: inline-flex;\n}`,
    MARCA_FIN,
  ].join("\n");
}
