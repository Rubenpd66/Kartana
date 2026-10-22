import type { CartaPublica } from "@/lib/tipos/carta";

/** Mínimo de platos visibles para que una carta salga en buscadores (docs/arquitectura.md §4.1). */
export const PLATOS_PARA_INDEXAR = 5;

/** Platos visibles de la carta (la carta pública ya solo trae lo visible). */
export function contarPlatos(carta: CartaPublica): number {
  return carta.secciones.reduce((total, s) => total + s.platos.length, 0);
}

/** Se indexa si el dueño lo permite y la carta tiene al menos 5 platos. Si no: `noindex, follow`. */
export function esIndexable(carta: CartaPublica): boolean {
  return carta.local.permitirIndexar && contarPlatos(carta) >= PLATOS_PARA_INDEXAR;
}
