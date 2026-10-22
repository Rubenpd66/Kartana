import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { Traducciones } from "@/lib/tipos/dominio";

/**
 * Texto en `idioma` si hay traducción (no vacía); si no, el original.
 * `esOriginal` es true cuando se devuelve el original en un idioma distinto del español (para poner lang="es").
 */
export function elegirTexto<C extends string>(
  original: string,
  traducciones: Traducciones<C>,
  campo: C,
  idioma: IdiomaCarta,
): { texto: string; esOriginal: boolean } {
  if (idioma === "es") return { texto: original, esOriginal: false };
  const traducido = traducciones[idioma]?.[campo]?.texto;
  if (typeof traducido === "string" && traducido.trim() !== "") return { texto: traducido, esOriginal: false };
  return { texto: original, esOriginal: true };
}
