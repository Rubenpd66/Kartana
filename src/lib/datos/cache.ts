import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Etiquetas de caché de las cartas públicas (ver docs/arquitectura.md §4.3).
// En la v0.2 este archivo pasa al carril traduccion (añade la traducción en segundo plano).

export const etiquetaCarta = (slug: string): string => `carta:${slug}`;
export const etiquetaLocal = (localId: string): string => `local:${localId}`;
export const ETIQUETA_LISTA_CARTAS = "cartas";

async function leerSlug(localId: string): Promise<string | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("locales").select("slug").eq("id", localId).maybeSingle();
  return (data as { slug?: string } | null)?.slug ?? null;
}

async function etiquetasDe(localId: string, opciones: { slugAnterior?: string; listaCartas?: boolean }): Promise<string[]> {
  const slug = await leerSlug(localId);
  const etiquetas = [];
  if (slug) etiquetas.push(etiquetaCarta(slug));
  etiquetas.push(etiquetaLocal(localId));
  if (opciones.slugAnterior && opciones.slugAnterior !== slug) etiquetas.push(etiquetaCarta(opciones.slugAnterior));
  if (opciones.listaCartas) etiquetas.push(ETIQUETA_LISTA_CARTAS);
  return etiquetas;
}

/**
 * Invalida al momento (updateTag) la carta pública del local. SOLO dentro de acciones de servidor.
 * Si el slug cambió, pasar el anterior; si cambia lo que sale en el sitemap, `listaCartas: true`.
 */
export async function trasGuardarCarta(
  localId: string,
  opciones: { slugAnterior?: string; listaCartas?: boolean } = {},
): Promise<void> {
  for (const etiqueta of await etiquetasDe(localId, opciones)) updateTag(etiqueta);
}

/** Lo mismo con revalidateTag(tag, { expire: 0 }), para route handlers y after(). Incluye la lista de cartas. */
export async function revalidarCartaFueraDeAccion(localId: string): Promise<void> {
  for (const etiqueta of await etiquetasDe(localId, { listaCartas: true })) revalidateTag(etiqueta, { expire: 0 });
}
