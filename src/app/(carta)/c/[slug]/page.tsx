import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { metadatosCarta, metadatosCartaNoEncontrada } from "@/lib/carta/metadatos";
import { resolverCarta } from "@/lib/carta/resolver";
import { buscarSlugActual, obtenerCartaPublica } from "@/lib/datos/publico";
import { SLUG_DEMO } from "@/lib/dominio/slugs";
import { ContenidoCarta } from "./contenido-carta";

// Carta pública en español: estática y cacheada ('use cache' + etiqueta por local en obtenerCartaPublica).
// No lee cookies, cabeceras ni searchParams. Con ensureStatic = "navigation", la primera visita a un slug
// que no se generó en el build espera a la página completa, así notFound() responde con un 404 de verdad.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return [{ slug: SLUG_DEMO }];
}

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const decision = await resolverCarta(slug, { obtenerCartaPublica, buscarSlugActual });
  return decision.tipo === "carta" ? metadatosCarta(decision.carta, "es") : metadatosCartaNoEncontrada();
}

export default async function PaginaCarta({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const decision = await resolverCarta(slug, { obtenerCartaPublica, buscarSlugActual });
  if (decision.tipo === "redirigir") permanentRedirect(decision.destino);
  if (decision.tipo === "no_encontrada") notFound();
  return <ContenidoCarta carta={decision.carta} idioma="es" />;
}
