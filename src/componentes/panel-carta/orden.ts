/** Copia de `lista` con el elemento `indice` movido una posición (`delta` -1 sube, 1 baja). Fuera de rango: copia igual. */
export function mover<T>(lista: readonly T[], indice: number, delta: -1 | 1): T[] {
  const copia = [...lista];
  const destino = indice + delta;
  if (indice < 0 || indice >= copia.length || destino < 0 || destino >= copia.length) return copia;
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}
