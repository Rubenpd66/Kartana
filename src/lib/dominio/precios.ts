import type { FormatoPrecio } from "@/lib/tipos/dominio";

/** Formatos de las variantes de venta (mismos códigos que privado.precios_validos en SQL). */
export const FORMATOS_PRECIO = [
  "unico",
  "tapa",
  "pincho",
  "media_racion",
  "racion",
  "racion_mediana",
  "racion_grande",
  "unidad",
  "media_docena",
  "docena",
  "copa",
  "botella",
  "jarra",
  "pequeno",
  "mediano",
  "grande",
  "otro",
] as const satisfies readonly FormatoPrecio[];

export function esFormatoPrecio(valor: string): valor is FormatoPrecio {
  return (FORMATOS_PRECIO as readonly string[]).includes(valor);
}

const formateadores = new Map<string, Intl.NumberFormat>();

/**
 * Céntimos -> texto en euros según el locale del diccionario ("12,50 €" en es-ES, "€12.50" en en).
 * Ojo: Intl pone un espacio duro (U+00A0) entre el número y el símbolo, para que no se partan de línea.
 */
export function formatearPrecio(centimos: number, locale: string): string {
  let formato = formateadores.get(locale);
  if (!formato) {
    formato = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
    formateadores.set(locale, formato);
  }
  return formato.format(centimos / 100);
}
