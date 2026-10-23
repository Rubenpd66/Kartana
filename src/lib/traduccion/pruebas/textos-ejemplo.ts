// Textos traducibles de ejemplo para los tests de src/lib/traduccion. Solo para *.test.ts.
import type { IdiomaDestino, TextoTraducido } from "@/lib/tipos/dominio";
import type { TextoTraducible } from "@/lib/tipos/traduccion";

export const HUELLA_A = "aaaaaaaaaaaaaaaa";
export const HUELLA_B = "bbbbbbbbbbbbbbbb";

export function traducido(texto: string, origen: "auto" | "manual", huella: string): TextoTraducido {
  return { texto, origen, huella, fecha: "2026-10-01T10:00:00Z" };
}

export function textoDe(
  campo: string,
  original: string,
  traducciones: Partial<Record<IdiomaDestino, TextoTraducido>> = {},
  extra: Partial<TextoTraducible> = {},
): TextoTraducible {
  return { tabla: "platos", filaId: "plato-1", campo, original, huellaActual: HUELLA_A, traducciones, ...extra };
}
