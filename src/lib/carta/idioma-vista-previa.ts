import { esIdiomaCarta, IDIOMA_CARTA_POR_DEFECTO, type IdiomaCarta } from "@/lib/i18n/idiomas";

/** Idioma de la vista previa a partir de `?idioma=`: solo si es de la carta y está activo; si no, español. */
export function idiomaVistaPrevia(valor: string | string[] | undefined, activos: readonly IdiomaCarta[]): IdiomaCarta {
  const primero = Array.isArray(valor) ? valor[0] : valor;
  if (primero && esIdiomaCarta(primero) && activos.includes(primero)) return primero;
  return IDIOMA_CARTA_POR_DEFECTO;
}
