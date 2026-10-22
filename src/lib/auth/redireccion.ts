// Validación del parámetro `siguiente` (adónde volver tras entrar). Pura: sirve en servidor y navegador.

export const RUTA_POR_DEFECTO = "/panel";

const LARGO_MAXIMO = 512;

/**
 * Devuelve `valor` solo si es una ruta interna segura; si no, "/panel".
 * Evita redirecciones abiertas: debe empezar por "/", no por "//", sin "\" ni caracteres de control.
 */
export function validarSiguiente(valor: string | null | undefined): string {
  if (typeof valor !== "string" || valor.length === 0 || valor.length > LARGO_MAXIMO) return RUTA_POR_DEFECTO;
  if (!valor.startsWith("/") || valor.startsWith("//")) return RUTA_POR_DEFECTO;
  if (valor.includes("\\")) return RUTA_POR_DEFECTO;
  // Los navegadores ignoran tabuladores y saltos de línea en las URL ("/\t/malo.com" sería "//malo.com").
  if (/[\u0000-\u001f\u007f]/.test(valor)) return RUTA_POR_DEFECTO;
  return valor;
}
