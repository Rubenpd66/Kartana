import { colorMarcaValido, colorTextoSobre } from "@/lib/dominio/contraste";

/** Ocho colores que cumplen el contraste 4,5:1 con texto blanco. Los nombres están en el diccionario. */
export const COLORES_SUGERIDOS = ["#b9461a", "#a3262a", "#9a3412", "#8a5a00", "#2f6b3a", "#0f6b6b", "#1d4f91", "#6b3fa0"] as const;

/** Color normalizado, si se puede usar de marca y el color del texto que llevaría encima. */
export function evaluarColor(entrada: string): { color: string; valido: boolean; texto: "#ffffff" | "#1f1a17" } {
  const color = entrada.trim().toLowerCase();
  const valido = colorMarcaValido(color);
  return { color, valido, texto: valido ? colorTextoSobre(color) : "#1f1a17" };
}
