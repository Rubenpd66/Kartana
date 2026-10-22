// Contraste de color según WCAG 2.x.

const HEX = /^#([0-9a-fA-F]{6})$/;
const TEXTO_OSCURO = "#1f1a17";

function luminancia(color: string): number {
  const coincidencia = HEX.exec(color);
  if (!coincidencia) throw new Error(`Color no válido: ${color}`);
  const valor = parseInt(coincidencia[1], 16);
  const canales = [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

/** Ratio de contraste WCAG entre dos colores "#rrggbb" (de 1 a 21). Lanza si el formato no es válido. */
export function ratioContraste(colorA: string, colorB: string): number {
  const a = luminancia(colorA);
  const b = luminancia(colorB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** "#rrggbb" en minúsculas y con contraste >= 4,5:1 contra blanco (texto blanco encima legible). */
export function colorMarcaValido(color: string): boolean {
  if (!/^#[0-9a-f]{6}$/.test(color)) return false;
  return ratioContraste(color, "#ffffff") >= 4.5;
}

/** Color de texto con más contraste sobre `fondo`: blanco o casi negro. */
export function colorTextoSobre(fondo: string): "#ffffff" | "#1f1a17" {
  return ratioContraste(fondo, "#ffffff") >= ratioContraste(fondo, TEXTO_OSCURO) ? "#ffffff" : TEXTO_OSCURO;
}
