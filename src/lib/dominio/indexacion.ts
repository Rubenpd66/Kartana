// Cuándo una carta (y cada idioma) sale en buscadores (docs/arquitectura.md §4.1). Pura: sin red.
// La usan listarCartasIndexables (sitemap) y, si quiere, la página /c/[slug]/[idioma] (noindex).

import { IDIOMAS_CARTA, type IdiomaCarta } from "@/lib/i18n/idiomas";

/** Mínimo de platos visibles para que una carta se indexe. */
export const PLATOS_PARA_INDEXAR = 5;
/** Parte de los nombres de plato visibles que deben estar traducidos para indexar un idioma. */
export const UMBRAL_TRADUCCION_INDEXAR = 0.9;

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function nombreTraducido(traducciones: unknown, idioma: IdiomaCarta): boolean {
  if (!esObjeto(traducciones)) return false;
  const porIdioma = traducciones[idioma];
  const nombre = esObjeto(porIdioma) ? porIdioma.nombre : undefined;
  return esObjeto(nombre) && typeof nombre.texto === "string" && nombre.texto.trim() !== "";
}

/**
 * Idiomas con página propia indexable: siempre «es»; los demás, si están activos y al menos el 90 % de los
 * nombres de los platos visibles tienen traducción en ese idioma. En el orden de IDIOMAS_CARTA.
 */
export function idiomasIndexables(
  idiomasActivos: readonly string[],
  platosVisibles: ReadonlyArray<{ traducciones?: unknown }>,
): IdiomaCarta[] {
  return IDIOMAS_CARTA.filter((idioma) => {
    if (idioma === "es") return true;
    if (!idiomasActivos.includes(idioma) || platosVisibles.length === 0) return false;
    const traducidos = platosVisibles.filter((p) => nombreTraducido(p.traducciones, idioma)).length;
    return traducidos >= UMBRAL_TRADUCCION_INDEXAR * platosVisibles.length;
  });
}
