import { LIMITES_EXTRA } from "./limites";

const BUCKET = "imagenes";
/** Un solo nombre de archivo (sin barras ni puntos de más) con las extensiones que admite Storage. */
const NOMBRE_ARCHIVO = /^[A-Za-z0-9_-]{1,64}\.(png|webp|jpg)$/;

/** URL pública absoluta de un archivo del bucket `imagenes`. */
export function urlPublicaImagen(ruta: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const camino = ruta.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${BUCKET}/${camino}`;
}

function aleatorio(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** "<localId>/logo/<aleatorio>.png" (nombre nuevo en cada subida para que la CDN no sirva el viejo). */
export function rutaNuevoLogo(localId: string): string {
  return `${localId}/logo/${aleatorio()}.png`;
}

/** "<localId>/platos/<platoId>/<aleatorio>.webp". */
export function rutaNuevaFotoPlato(localId: string, platoId: string): string {
  return `${localId}/platos/${platoId}/${aleatorio()}.webp`;
}

function esArchivoEn(prefijo: string, ruta: string): boolean {
  if (ruta.length > LIMITES_EXTRA.rutaImagen || !ruta.startsWith(prefijo)) return false;
  return NOMBRE_ARCHIVO.test(ruta.slice(prefijo.length));
}

/** La ruta es un archivo directamente dentro de "<localId>/logo/" (png, webp o jpg). */
export function esRutaLogoDe(localId: string, ruta: string): boolean {
  return esArchivoEn(`${localId}/logo/`, ruta);
}

/** La ruta es un archivo directamente dentro de "<localId>/platos/<platoId>/". */
export function esRutaFotoDe(localId: string, platoId: string, ruta: string): boolean {
  return esArchivoEn(`${localId}/platos/${platoId}/`, ruta);
}
