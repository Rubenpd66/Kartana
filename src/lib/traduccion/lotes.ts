// Reparte los textos en lotes para Google Translation v2 (puro).
// Google admite hasta 128 textos por petición; nos quedamos en 100 y ~25.000 caracteres
// para ir holgados y que cada lote reserve una cuota pequeña.

export type LimitesLote = { maxTextos: number; maxCaracteres: number };

export const LIMITES_LOTE: LimitesLote = { maxTextos: 100, maxCaracteres: 25_000 };

/** Mantiene el orden. Un elemento más largo que `maxCaracteres` va solo en su lote. */
export function partirEnLotes<T>(elementos: readonly T[], longitud: (elemento: T) => number, limites: LimitesLote = LIMITES_LOTE): T[][] {
  const lotes: T[][] = [];
  let actual: T[] = [];
  let caracteres = 0;
  for (const elemento of elementos) {
    const largo = longitud(elemento);
    const noCabe = actual.length >= limites.maxTextos || (actual.length > 0 && caracteres + largo > limites.maxCaracteres);
    if (noCabe) {
      lotes.push(actual);
      actual = [];
      caracteres = 0;
    }
    actual.push(elemento);
    caracteres += largo;
  }
  if (actual.length > 0) lotes.push(actual);
  return lotes;
}
