import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { metadatosCarta, metadatosCartaNoEncontrada } from "@/lib/carta/metadatos";
import { resolverCartaIdioma } from "@/lib/carta/resolver";
import { buscarSlugActual, obtenerCartaPublica } from "@/lib/datos/publico";
import { SLUG_DEMO } from "@/lib/dominio/slugs";
import { ContenidoCarta } from "../contenido-carta";

// Carta pública en otro idioma (/c/<slug>/en, /fr…): estática y cacheada como la española.
// «es» y los idiomas no activos en el local dan 404 (resolverCartaIdioma).
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return [{ slug: SLUG_DEMO, idioma: "en" }];
}

export async function generateMetadata({ params }: PageProps<"/c/[slug]/[idioma]">): Promise<Metadata> {
  const { slug, idioma } = await params;
  const decision = await resolverCartaIdioma(slug, idioma, { obtenerCartaPublica, buscarSlugActual });
  return decision.tipo === "carta" ? metadatosCarta(decision.carta, decision.idioma) : metadatosCartaNoEncontrada();
}

export default async function PaginaCartaIdioma({ params }: PageProps<"/c/[slug]/[idioma]">) {
  const { slug, idioma } = await params;
  const decision = await resolverCartaIdioma(slug, idioma, { obtenerCartaPublica, buscarSlugActual });
  if (decision.tipo === "redirigir") permanentRedirect(decision.destino);
  if (decision.tipo === "no_encontrada") notFound();
  return <ContenidoCarta carta={decision.carta} idioma={decision.idioma} />;
}
