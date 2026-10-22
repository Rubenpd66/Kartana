// Idiomas de la web/panel y de las cartas públicas.
// Regla: el idioma por defecto va sin prefijo; el resto, con /xx al principio
// (web) o al final (carta: /c/<local>/<xx>). Las comprobaciones de ruta se
// hacen SIEMPRE sin el prefijo, en servidor y cliente (lección 4 de KleyBom).

export const IDIOMAS_WEB = ["es"] as const; // "en" llegará después
export type IdiomaWeb = (typeof IDIOMAS_WEB)[number];
export const IDIOMA_WEB_POR_DEFECTO: IdiomaWeb = "es";

export const IDIOMAS_CARTA = ["es", "en", "fr", "de", "ca", "eu", "gl"] as const;
export type IdiomaCarta = (typeof IDIOMAS_CARTA)[number];
export const IDIOMA_CARTA_POR_DEFECTO: IdiomaCarta = "es";

/** Nombre de cada idioma en su propia lengua, para el selector de la carta. */
export const NOMBRE_IDIOMA: Record<IdiomaCarta, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  ca: "Català",
  eu: "Euskara",
  gl: "Galego",
};

export function esIdiomaCarta(valor: string): valor is IdiomaCarta {
  return (IDIOMAS_CARTA as readonly string[]).includes(valor);
}

export function esIdiomaWeb(valor: string): valor is IdiomaWeb {
  return (IDIOMAS_WEB as readonly string[]).includes(valor);
}

/**
 * Separa el prefijo de idioma de una ruta de la web.
 * "/en/precios" -> { idioma: "en", ruta: "/precios" }; "/precios" -> { idioma: "es", ruta: "/precios" }
 */
export function quitarPrefijoIdioma(ruta: string): { idioma: IdiomaWeb; ruta: string } {
  const [, primero, ...resto] = ruta.split("/");
  if (primero && primero !== IDIOMA_WEB_POR_DEFECTO && esIdiomaWeb(primero)) {
    return { idioma: primero, ruta: "/" + resto.join("/") };
  }
  return { idioma: IDIOMA_WEB_POR_DEFECTO, ruta: ruta || "/" };
}

/** Añade el prefijo de idioma a una ruta de la web (sin prefijo para el idioma por defecto). */
export function conPrefijoIdioma(ruta: string, idioma: IdiomaWeb): string {
  const limpia = ruta.startsWith("/") ? ruta : `/${ruta}`;
  if (idioma === IDIOMA_WEB_POR_DEFECTO) return limpia;
  return limpia === "/" ? `/${idioma}` : `/${idioma}${limpia}`;
}

/** Ruta de la carta pública de un local en un idioma. */
export function rutaCarta(slug: string, idioma: IdiomaCarta = IDIOMA_CARTA_POR_DEFECTO): string {
  return idioma === IDIOMA_CARTA_POR_DEFECTO ? `/c/${slug}` : `/c/${slug}/${idioma}`;
}
