import { idiomasIndexables, PLATOS_PARA_INDEXAR } from "@/lib/dominio/indexacion";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { CartaPublica } from "@/lib/tipos/carta";

/** Mínimo de platos visibles para que una carta salga en buscadores (docs/arquitectura.md §4.1). */
export { PLATOS_PARA_INDEXAR };

/** Platos visibles de la carta (la carta pública ya solo trae lo visible). */
export function contarPlatos(carta: CartaPublica): number {
  return carta.secciones.reduce((total, s) => total + s.platos.length, 0);
}

/** Se indexa si el dueño lo permite y la carta tiene al menos 5 platos. Si no: `noindex, follow`. */
export function esIndexable(carta: CartaPublica): boolean {
  return carta.local.permitirIndexar && contarPlatos(carta) >= PLATOS_PARA_INDEXAR;
}

/**
 * Idiomas con página indexable (los que van en `hreflang`): ninguno si la carta no se indexa; si se indexa,
 * «es» y los activos con al menos el 90 % de los nombres de plato visibles traducidos (misma regla que el sitemap).
 */
export function idiomasIndexablesCarta(carta: CartaPublica): IdiomaCarta[] {
  if (!esIndexable(carta)) return [];
  return idiomasIndexables(
    carta.local.idiomasActivos,
    carta.secciones.flatMap((s) => s.platos),
  );
}

export function esIdiomaIndexable(carta: CartaPublica, idioma: IdiomaCarta): boolean {
  return idiomasIndexablesCarta(carta).includes(idioma);
}
