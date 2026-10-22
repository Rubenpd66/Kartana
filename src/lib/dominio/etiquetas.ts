import type { CodigoEtiqueta } from "@/lib/tipos/dominio";

/** Etiquetas informativas del plato (no son alérgenos). Mismos códigos que el CHECK de SQL. */
export const ETIQUETAS = [
  "vegano",
  "vegetariano",
  "sin_gluten",
  "sin_lactosa",
  "picante",
  "casero",
  "recomendado",
  "nuevo",
] as const satisfies readonly CodigoEtiqueta[];

export function esEtiqueta(valor: string): valor is CodigoEtiqueta {
  return (ETIQUETAS as readonly string[]).includes(valor);
}
