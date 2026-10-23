import { crearMatriz, MARGEN_MODULOS, trazadoQr } from "./matriz";

/** SVG del QR: fondo blanco y un solo `path` negro. Nítido a cualquier tamaño. */
export function qrComoSvg(
  url: string,
  { tamanoPx = 512, margenModulos = MARGEN_MODULOS }: { tamanoPx?: number; margenModulos?: number } = {},
): string {
  const matriz = crearMatriz(url);
  const lado = matriz.tamano + margenModulos * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" width="${tamanoPx}" height="${tamanoPx}" shape-rendering="crispEdges">` +
    `<rect width="${lado}" height="${lado}" fill="#ffffff"/>` +
    `<path fill="#000000" d="${trazadoQr(matriz, margenModulos)}"/>` +
    `</svg>`
  );
}
