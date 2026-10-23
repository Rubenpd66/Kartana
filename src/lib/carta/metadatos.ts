import type { Metadata } from "next";
import { rutaCarta } from "@/lib/i18n/idiomas";
import type { CartaPublica } from "@/lib/tipos/carta";
import { esIndexable } from "./indexable";

const LARGO_DESCRIPCION = 160;

function recortar(texto: string): string {
  return texto.length <= LARGO_DESCRIPCION ? texto : `${texto.slice(0, LARGO_DESCRIPCION - 1).trimEnd()}…`;
}

/** Descripción: la del local o, si no hay, los nombres de las secciones. */
export function descripcionCarta(carta: CartaPublica): string {
  const { nombre, descripcion } = carta.local;
  if (descripcion?.trim()) return recortar(descripcion.trim());
  const secciones = carta.secciones.map((s) => s.nombre).join(", ");
  return recortar(secciones ? `Carta de ${nombre}: ${secciones}.` : `Carta de ${nombre}.`);
}

/** Metadatos de /c/<slug>: título, descripción, canónica, robots y Open Graph. */
export function metadatosCarta(carta: CartaPublica): Metadata {
  const titulo = `Carta de ${carta.local.nombre}`;
  const descripcion = descripcionCarta(carta);
  const url = rutaCarta(carta.local.slug);
  return {
    // Sin «· Kartana»: la carta es del bar.
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: url },
    robots: { index: esIndexable(carta), follow: true },
    openGraph: {
      type: "website",
      locale: "es_ES",
      title: titulo,
      description: descripcion,
      siteName: carta.local.nombre,
      url,
      ...(carta.local.logoUrl ? { images: [{ url: carta.local.logoUrl }] } : {}),
    },
  };
}

/** Carta que no existe: nunca en buscadores. */
export function metadatosCartaNoEncontrada(): Metadata {
  return { robots: { index: false, follow: false } };
}
