// Datos estructurados (schema.org) de la carta pública para Google: Restaurant -> Menu -> MenuSection -> MenuItem.

import { IDIOMA_CARTA_POR_DEFECTO, type IdiomaCarta } from "@/lib/i18n/idiomas";
import type { CartaPublica, PlatoPublico } from "@/lib/tipos/carta";
import type { CodigoEtiqueta, DiaSemana, Precio } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { tituloCarta } from "./metadatos";
import { etiquetaPrecio, textoEn } from "./textos";

const DIAS_SCHEMA: Record<DiaSemana, string> = {
  1: "https://schema.org/Monday",
  2: "https://schema.org/Tuesday",
  3: "https://schema.org/Wednesday",
  4: "https://schema.org/Thursday",
  5: "https://schema.org/Friday",
  6: "https://schema.org/Saturday",
  7: "https://schema.org/Sunday",
};

const DIETAS: Partial<Record<CodigoEtiqueta, string>> = {
  vegano: "https://schema.org/VeganDiet",
  vegetariano: "https://schema.org/VegetarianDiet",
  sin_gluten: "https://schema.org/GlutenFreeDiet",
};

export type OfertaJsonLd = {
  "@type": "Offer";
  name?: string;
  price: string;
  priceCurrency: "EUR";
  availability?: string;
};

export type PlatoJsonLd = {
  "@type": "MenuItem";
  name: string;
  description?: string;
  offers?: OfertaJsonLd[];
  suitableForDiet?: string[];
};

export type SeccionJsonLd = { "@type": "MenuSection"; name: string; description?: string; hasMenuItem: PlatoJsonLd[] };

export type HorarioJsonLd = { "@type": "OpeningHoursSpecification"; dayOfWeek: string[]; opens: string; closes: string };

export type RestauranteJsonLd = {
  "@context": "https://schema.org";
  "@type": "Restaurant";
  name: string;
  inLanguage: IdiomaCarta;
  url: string;
  description?: string;
  address?: string;
  telephone?: string;
  image?: string;
  openingHoursSpecification?: HorarioJsonLd[];
  hasMenu: { "@type": "Menu"; name: string; url: string; inLanguage: IdiomaCarta; hasMenuSection: SeccionJsonLd[] };
};

function ofertas(plato: PlatoPublico, diccionario: DiccionarioCarta, idioma: IdiomaCarta): OfertaJsonLd[] {
  return plato.precios
    .filter((p): p is Precio & { centimos: number } => p.centimos !== null)
    .map((p) => {
      const nombre = etiquetaPrecio(p, diccionario, plato.traducciones, idioma);
      return {
        "@type": "Offer" as const,
        ...(nombre ? { name: nombre } : {}),
        price: (p.centimos / 100).toFixed(2),
        priceCurrency: "EUR" as const,
        ...(plato.agotado ? { availability: "https://schema.org/SoldOut" } : {}),
      };
    });
}

function platoJsonLd(plato: PlatoPublico, diccionario: DiccionarioCarta, idioma: IdiomaCarta): PlatoJsonLd {
  const lista = ofertas(plato, diccionario, idioma);
  const dietas = plato.etiquetas.flatMap((e) => (DIETAS[e] ? [DIETAS[e]] : []));
  return {
    "@type": "MenuItem",
    name: textoEn(plato.nombre, plato.traducciones, "nombre", idioma).texto,
    ...(plato.descripcion ? { description: textoEn(plato.descripcion, plato.traducciones, "descripcion", idioma).texto } : {}),
    ...(lista.length > 0 ? { offers: lista } : {}),
    ...(dietas.length > 0 ? { suitableForDiet: dietas } : {}),
  };
}

/** Una entrada por franja distinta, con todos los días que la comparten. */
function horarios(carta: CartaPublica): HorarioJsonLd[] {
  const grupos = new Map<string, HorarioJsonLd>();
  const ordenadas = [...carta.local.horarios].sort((a, b) => a.dia - b.dia || a.abre.localeCompare(b.abre));
  for (const f of ordenadas) {
    const clave = `${f.abre}-${f.cierra}`;
    const grupo = grupos.get(clave);
    if (grupo) {
      if (!grupo.dayOfWeek.includes(DIAS_SCHEMA[f.dia])) grupo.dayOfWeek.push(DIAS_SCHEMA[f.dia]);
    } else {
      grupos.set(clave, { "@type": "OpeningHoursSpecification", dayOfWeek: [DIAS_SCHEMA[f.dia]], opens: f.abre, closes: f.cierra });
    }
  }
  return [...grupos.values()];
}

/** Objeto JSON-LD del restaurante y su carta en un idioma. `urlCarta` es la dirección absoluta de la página. */
export function jsonLdCarta(
  carta: CartaPublica,
  diccionario: DiccionarioCarta,
  urlCarta: string,
  idioma: IdiomaCarta = IDIOMA_CARTA_POR_DEFECTO,
): RestauranteJsonLd {
  const { local } = carta;
  const franjas = horarios(carta);
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: local.nombre,
    inLanguage: idioma,
    url: urlCarta,
    ...(local.descripcion ? { description: textoEn(local.descripcion, local.traducciones, "descripcion", idioma).texto } : {}),
    ...(local.direccion ? { address: local.direccion } : {}),
    ...(local.telefono ? { telephone: local.telefono } : {}),
    ...(local.logoUrl ? { image: local.logoUrl } : {}),
    ...(franjas.length > 0 ? { openingHoursSpecification: franjas } : {}),
    hasMenu: {
      "@type": "Menu",
      name: tituloCarta(local.nombre, idioma),
      url: urlCarta,
      inLanguage: idioma,
      hasMenuSection: carta.secciones.map((s) => ({
        "@type": "MenuSection" as const,
        name: textoEn(s.nombre, s.traducciones, "nombre", idioma).texto,
        ...(s.descripcion ? { description: textoEn(s.descripcion, s.traducciones, "descripcion", idioma).texto } : {}),
        hasMenuItem: s.platos.map((p) => platoJsonLd(p, diccionario, idioma)),
      })),
    },
  };
}

/** JSON para un <script type="application/ld+json">, con `<` escapado (no se puede cerrar la etiqueta). */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}
