// Qué hace /c/[slug] con un slug: mostrar la carta, redirigir (slug antiguo) o 404.
// Las consultas llegan como dependencias para poder probarlo sin base de datos.

import { LIMITES } from "@/lib/dominio/limites";
import { rutaCarta } from "@/lib/i18n/idiomas";
import type { CartaPublica } from "@/lib/tipos/carta";

export type DecisionCarta =
  | { tipo: "carta"; carta: CartaPublica }
  | { tipo: "redirigir"; destino: string }
  | { tipo: "no_encontrada" };

type Dependencias = {
  obtenerCartaPublica: (slug: string) => Promise<CartaPublica | null>;
  buscarSlugActual: (slug: string) => Promise<string | null>;
};

/** Formato de slug (el mismo que el CHECK de SQL): lo que no encaja no llega a la base de datos. */
function formatoValido(slug: string): boolean {
  return slug.length >= LIMITES.slugMin && slug.length <= LIMITES.slugMax && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

export async function resolverCarta(slug: string, deps: Dependencias): Promise<DecisionCarta> {
  if (!formatoValido(slug)) return { tipo: "no_encontrada" };
  const carta = await deps.obtenerCartaPublica(slug);
  if (carta) return { tipo: "carta", carta };
  const actual = await deps.buscarSlugActual(slug);
  if (actual && actual !== slug) return { tipo: "redirigir", destino: rutaCarta(actual) };
  return { tipo: "no_encontrada" };
}
