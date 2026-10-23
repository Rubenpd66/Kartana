import QRCode from "qrcode";

export type MatrizQr = {
  /** Módulos por lado (sin zona tranquila). */
  tamano: number;
  /** true si el módulo (fila, col) es negro. Fuera de la matriz, false. */
  oscuro: (fila: number, col: number) => boolean;
};

/**
 * Matriz del QR de `texto`, con corrección de errores M. Sirve para dibujarlo como vectores
 * (PDF o SVG). Genérica: la URL entra por parámetro.
 */
export function crearMatriz(texto: string): MatrizQr {
  if (!texto) throw new Error("crearMatriz: texto vacío");
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: "M" });
  const tamano = modules.size;
  return {
    tamano,
    oscuro: (fila, col) => fila >= 0 && col >= 0 && fila < tamano && col < tamano && Boolean(modules.get(fila, col)),
  };
}

/** Margen mínimo de la norma («zona tranquila»), en módulos. */
export const MARGEN_MODULOS = 4;

/**
 * Trazado SVG (un solo `d`) con un rectángulo por cada tramo horizontal de módulos negros,
 * en unidades de módulo y desplazado `margen` módulos.
 */
export function trazadoQr(matriz: MatrizQr, margen: number = MARGEN_MODULOS): string {
  const partes: string[] = [];
  for (let f = 0; f < matriz.tamano; f++) {
    let c = 0;
    while (c < matriz.tamano) {
      if (!matriz.oscuro(f, c)) {
        c++;
        continue;
      }
      const ini = c;
      while (c < matriz.tamano && matriz.oscuro(f, c)) c++;
      partes.push(`M${ini + margen} ${f + margen}h${c - ini}v1h${ini - c}z`);
    }
  }
  return partes.join("");
}
