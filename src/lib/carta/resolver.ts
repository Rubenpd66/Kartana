// Qué hace /c/[slug] con un slug: mostrar la carta, redirigir (slug antiguo) o 404.
// Las consultas llegan como dependencias para poder probarlo sin base de datos.

import { LIMITES } from "@/lib/dominio/limites";
import { esIdiomaCarta, IDIOMA_CARTA_POR_DEFECTO, rutaCarta, type IdiomaCarta } from "@/lib/i18n/idiomas";
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

export type DecisionCartaIdioma =
  | { tipo: "carta"; carta: CartaPublica; idioma: IdiomaCarta }
  | { tipo: "redirigir"; destino: string }
  | { tipo: "no_encontrada" };

/**
 * Qué hace /c/[slug]/[idioma]: el idioma tiene que ser de la carta, distinto de «es» (la española es
 * /c/<slug>, sin duplicados) y estar activo en el local. Si no, 404. Un slug antiguo redirige en el mismo idioma.
 */
export async function resolverCartaIdioma(slug: string, idioma: string, deps: Dependencias): Promise<DecisionCartaIdioma> {
  if (!esIdiomaCarta(idioma) || idioma === IDIOMA_CARTA_POR_DEFECTO) return { tipo: "no_encontrada" };
  const decision = await resolverCarta(slug, deps);
  if (decision.tipo === "redirigir") return { tipo: "redirigir", destino: `${decision.destino}/${idioma}` };
  if (decision.tipo === "no_encontrada" || !decision.carta.local.idiomasActivos.includes(idioma)) {
    return { tipo: "no_encontrada" };
  }
  return { tipo: "carta", carta: decision.carta, idioma };
}
