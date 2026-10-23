import type { Metadata } from "next";
import { elegirTexto } from "@/lib/dominio/traducir";
import { IDIOMA_CARTA_POR_DEFECTO, rutaCarta, type IdiomaCarta } from "@/lib/i18n/idiomas";
import type { CartaPublica } from "@/lib/tipos/carta";
import { esIdiomaIndexable, idiomasIndexablesCarta } from "./indexable";

const LARGO_DESCRIPCION = 160;

/** Locale de Open Graph de cada idioma de la carta. */
const LOCALE_OG: Record<IdiomaCarta, string> = {
  es: "es_ES",
  en: "en_GB",
  fr: "fr_FR",
  de: "de_DE",
  ca: "ca_ES",
  eu: "eu_ES",
  gl: "gl_ES",
};

/** «Carta de {nombre}» en cada idioma (para el título de la página y el JSON-LD). */
const TITULO_CARTA: Record<IdiomaCarta, (nombre: string) => string> = {
  es: (n) => `Carta de ${n}`,
  en: (n) => `${n} – Menu`,
  fr: (n) => `Carte de ${n}`,
  de: (n) => `Speisekarte von ${n}`,
  ca: (n) => `Carta de ${n}`,
  eu: (n) => `${n} – Karta`,
  gl: (n) => `Carta de ${n}`,
};

export function tituloCarta(nombre: string, idioma: IdiomaCarta): string {
  return TITULO_CARTA[idioma](nombre);
}

function recortar(texto: string): string {
  return texto.length <= LARGO_DESCRIPCION ? texto : `${texto.slice(0, LARGO_DESCRIPCION - 1).trimEnd()}…`;
}

/** Descripción: la del local (traducida si se puede) o, si no hay, los nombres de las secciones. */
export function descripcionCarta(carta: CartaPublica, idioma: IdiomaCarta = IDIOMA_CARTA_POR_DEFECTO): string {
  const { nombre, descripcion, traducciones } = carta.local;
  if (descripcion?.trim()) return recortar(elegirTexto(descripcion.trim(), traducciones, "descripcion", idioma).texto);
  const secciones = carta.secciones.map((s) => elegirTexto(s.nombre, s.traducciones, "nombre", idioma).texto).join(", ");
  if (idioma !== "es") return recortar(secciones ? `${nombre}: ${secciones}.` : `${nombre}.`);
  return recortar(secciones ? `Carta de ${nombre}: ${secciones}.` : `Carta de ${nombre}.`);
}

/**
 * Metadatos de /c/<slug> y /c/<slug>/<idioma>: título, descripción, canónica (a sí misma), `hreflang` de los
 * idiomas indexables + x-default (la española), robots y Open Graph.
 */
export function metadatosCarta(carta: CartaPublica, idioma: IdiomaCarta = IDIOMA_CARTA_POR_DEFECTO): Metadata {
  const { slug, nombre } = carta.local;
  // Sin «· Kartana»: la carta es del bar.
  const titulo = tituloCarta(nombre, idioma);
  const descripcion = descripcionCarta(carta, idioma);
  const url = rutaCarta(slug, idioma);
  const languages: Record<string, string> = {};
  for (const i of idiomasIndexablesCarta(carta)) languages[i] = rutaCarta(slug, i);
  languages["x-default"] = rutaCarta(slug);
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: url, languages },
    robots: { index: esIdiomaIndexable(carta, idioma), follow: true },
    openGraph: {
      type: "website",
      locale: LOCALE_OG[idioma],
      title: titulo,
      description: descripcion,
      siteName: nombre,
      url,
      ...(carta.local.logoUrl ? { images: [{ url: carta.local.logoUrl }] } : {}),
    },
  };
}

/** Carta que no existe: nunca en buscadores. */
export function metadatosCartaNoEncontrada(): Metadata {
  return { robots: { index: false, follow: false } };
}
