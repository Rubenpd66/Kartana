// Índice de los diccionarios de la carta pública (archivo del director).
// Cada idioma vive en su archivo carta.<xx>.ts, del carril contenido.

import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { cartaCa } from "./carta.ca";
import { cartaDe } from "./carta.de";
import { cartaEn } from "./carta.en";
import { cartaEs } from "./carta.es";
import { cartaEu } from "./carta.eu";
import { cartaFr } from "./carta.fr";
import { cartaGl } from "./carta.gl";

const DICCIONARIOS: Record<IdiomaCarta, DiccionarioCarta> = {
  es: cartaEs,
  en: cartaEn,
  fr: cartaFr,
  de: cartaDe,
  ca: cartaCa,
  eu: cartaEu,
  gl: cartaGl,
};

export function diccionarioCarta(idioma: IdiomaCarta): DiccionarioCarta {
  return DICCIONARIOS[idioma];
}

export { cartaCa, cartaDe, cartaEn, cartaEs, cartaEu, cartaFr, cartaGl };
