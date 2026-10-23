import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { after } from "next/server";
import { leerInterruptores } from "@/lib/config/interruptores";
import { esIdiomaCarta } from "@/lib/i18n/idiomas";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Etiquetas de caché de las cartas públicas (ver docs/arquitectura.md §4.3) y, desde la v0.2
// (carril traduccion), la traducción automática en segundo plano al guardar.

export const etiquetaCarta = (slug: string): string => `carta:${slug}`;
export const etiquetaLocal = (localId: string): string => `local:${localId}`;
export const ETIQUETA_LISTA_CARTAS = "cartas";

type DatosLocal = { slug: string | null; tieneIdiomasDestino: boolean };

async function leerLocal(localId: string): Promise<DatosLocal> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("locales").select("slug, idiomas_activos").eq("id", localId).maybeSingle();
  const fila = data as { slug?: string; idiomas_activos?: string[] | null } | null;
  const idiomas = (fila?.idiomas_activos ?? []).filter((i) => esIdiomaCarta(i) && i !== "es");
  return { slug: fila?.slug ?? null, tieneIdiomasDestino: idiomas.length > 0 };
}

function etiquetasDe(localId: string, slug: string | null, opciones: { slugAnterior?: string; listaCartas?: boolean }): string[] {
  const etiquetas = [];
  if (slug) etiquetas.push(etiquetaCarta(slug));
  etiquetas.push(etiquetaLocal(localId));
  if (opciones.slugAnterior && opciones.slugAnterior !== slug) etiquetas.push(etiquetaCarta(opciones.slugAnterior));
  if (opciones.listaCartas) etiquetas.push(ETIQUETA_LISTA_CARTAS);
  return etiquetas;
}

/**
 * Traduce lo que haya cambiado cuando ya se ha respondido al dueño. Sin cola: si guarda 10 platos
 * seguidos, cada tarea encuentra menos pendientes (las huellas ya coinciden). traducirLocal invalida
 * la carta (revalidarCartaFueraDeAccion) si ha guardado algo. Dentro de after() en una acción de
 * servidor se pueden leer cookies, así que la sesión del dueño sigue valiendo.
 */
function programarTraduccion(localId: string): void {
  after(async () => {
    try {
      const { traducirLocal } = await import("@/lib/traduccion/traducir-local");
      await traducirLocal(localId);
    } catch {
      console.error("traduccion en segundo plano: error_inesperado");
    }
  });
}

/**
 * Invalida al momento (updateTag) la carta pública del local. SOLO dentro de acciones de servidor.
 * Si el slug cambió, pasar el anterior; si cambia lo que sale en el sitemap, `listaCartas: true`.
 * Si la traducción está activa y el local tiene idiomas de destino, la programa en segundo plano.
 */
export async function trasGuardarCarta(
  localId: string,
  opciones: { slugAnterior?: string; listaCartas?: boolean } = {},
): Promise<void> {
  const local = await leerLocal(localId);
  for (const etiqueta of etiquetasDe(localId, local.slug, opciones)) updateTag(etiqueta);
  if (leerInterruptores().traduccion && local.tieneIdiomasDestino) programarTraduccion(localId);
}

/** Lo mismo con revalidateTag(tag, { expire: 0 }), para route handlers y after(). Incluye la lista de cartas. */
export async function revalidarCartaFueraDeAccion(localId: string): Promise<void> {
  const { slug } = await leerLocal(localId);
  for (const etiqueta of etiquetasDe(localId, slug, { listaCartas: true })) revalidateTag(etiqueta, { expire: 0 });
}
