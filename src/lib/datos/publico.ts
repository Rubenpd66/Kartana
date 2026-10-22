import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { convertirACartaPublica } from "@/lib/dominio/carta";
import { urlPublicaImagen } from "@/lib/dominio/imagenes";
import { LIMITES } from "@/lib/dominio/limites";
import { crearClientePublico } from "@/lib/supabase/servidor";
import type { CartaIndexable, CartaPublica } from "@/lib/tipos/carta";
import { ETIQUETA_LISTA_CARTAS, etiquetaCarta, etiquetaLocal } from "./cache";
import {
  COLUMNAS_LOCAL_PUBLICO,
  COLUMNAS_MENU_PUBLICO,
  COLUMNAS_PLATO_PUBLICO,
  COLUMNAS_SECCION_PUBLICA,
  type FilaLocalPublica,
  type FilaMenu,
  type FilaPlato,
  type FilaSeccion,
} from "./filas";
import { filaALocal, filaAMenu, filaAPlato, filaASeccion } from "./mapeos";

// Lecturas públicas (rol anon, sin cookies), cacheadas con 'use cache'. La RLS decide qué se ve:
// solo locales publicados con acceso activo y, dentro, solo lo visible.

/** Mínimo de platos visibles para que una carta se indexe (docs/arquitectura.md §4.1). */
const PLATOS_PARA_INDEXAR = 5;

/** Formato de slug sin pasar por la base de datos (evita consultas con basura en la URL). */
const formatoSlug = (slug: string) =>
  slug.length >= LIMITES.slugMin && slug.length <= LIMITES.slugMax && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);

type FilaCartaPublica = FilaLocalPublica & {
  secciones: Array<Omit<FilaSeccion, "creado_en"> & { platos: Array<Omit<FilaPlato, "creado_en">> }>;
  menus: Array<Omit<FilaMenu, "creado_en">>;
};

const SELECT_CARTA = `${COLUMNAS_LOCAL_PUBLICO}, secciones(${COLUMNAS_SECCION_PUBLICA}, platos!platos_seccion_fk(${COLUMNAS_PLATO_PUBLICO})), menus(${COLUMNAS_MENU_PUBLICO})`;

/** Carta pública del slug, o null si no existe, no está publicada o no tiene acceso activo. */
export async function obtenerCartaPublica(slug: string): Promise<CartaPublica | null> {
  "use cache";
  cacheTag(etiquetaCarta(slug));
  cacheLife("hours");
  if (!formatoSlug(slug)) return null;

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("locales")
    .select(SELECT_CARTA)
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();
  // Si falla la base de datos se lanza: así no se cachea un «no existe» que no es verdad.
  if (error) throw new Error(`obtenerCartaPublica: ${error.message}`);
  if (!data) return null;

  const fila = data as unknown as FilaCartaPublica;
  cacheTag(etiquetaLocal(fila.id));
  return convertirACartaPublica(
    {
      local: filaALocal(fila),
      secciones: (fila.secciones ?? []).map((s) => ({ ...filaASeccion(s), platos: (s.platos ?? []).map(filaAPlato) })),
      menus: (fila.menus ?? []).map(filaAMenu),
    },
    urlPublicaImagen,
  );
}

/** Si `slugAnterior` fue de un local visible, su slug actual (para redirigir con 308); si no, null. */
export async function buscarSlugActual(slugAnterior: string): Promise<string | null> {
  "use cache";
  cacheTag(etiquetaCarta(slugAnterior));
  cacheLife("hours");
  if (!formatoSlug(slugAnterior)) return null;

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("slugs_anteriores")
    .select("local_id, locales(slug)")
    .eq("slug", slugAnterior)
    .maybeSingle();
  if (error) throw new Error(`buscarSlugActual: ${error.message}`);
  const fila = data as unknown as { local_id: string; locales: { slug: string } | null } | null;
  if (!fila) return null;
  cacheTag(etiquetaLocal(fila.local_id));
  const actual = fila.locales?.slug ?? null;
  return actual && actual !== slugAnterior ? actual : null;
}

/** Cartas para el sitemap: visibles, con permitir_indexar y al menos 5 platos visibles. v0.1: solo "es". */
export async function listarCartasIndexables(): Promise<CartaIndexable[]> {
  "use cache";
  cacheTag(ETIQUETA_LISTA_CARTAS);
  cacheLife("hours");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("locales")
    .select("slug, actualizado_en, platos(id, actualizado_en)")
    .eq("publicado", true)
    .eq("permitir_indexar", true)
    .order("slug");
  if (error) throw new Error(`listarCartasIndexables: ${error.message}`);

  const filas = (data ?? []) as unknown as Array<{ slug: string; actualizado_en: string; platos: Array<{ actualizado_en: string }> | null }>;
  return filas
    .filter((f) => (f.platos ?? []).length >= PLATOS_PARA_INDEXAR)
    .map((f) => ({
      slug: f.slug,
      idiomas: ["es"],
      actualizadoEn: [f.actualizado_en, ...(f.platos ?? []).map((p) => p.actualizado_en)].reduce((a, b) =>
        new Date(b).getTime() > new Date(a).getTime() ? b : a,
      ),
    }));
}
