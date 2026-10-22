// Ejemplos reales de variantes de precio, leídos de la carta de La Guagua (docs/datos/carta-la-guagua.md).
// Solo los importan archivos *.test.ts y los tests SQL usan los mismos casos.

import type { PrecioEntrada } from "@/lib/tipos/dominio";

export const PRECIOS_REALES: Record<string, PrecioEntrada[]> = {
  "Fritura de pescado (½ y ración)": [
    { formato: "media_racion", texto: null, centimos: 700 },
    { formato: "racion", texto: null, centimos: 950 },
  ],
  "Parrillada de marisco (solo ración)": [{ formato: "racion", texto: null, centimos: 1800 }],
  "Gamba roja a la plancha (½ docena y docena)": [
    { formato: "media_docena", texto: null, centimos: 700 },
    { formato: "docena", texto: null, centimos: 1400 },
  ],
  "Vieira (unidad)": [{ formato: "unidad", texto: null, centimos: 400 }],
  "Pulpo a la gallega (mediana y grande)": [
    { formato: "racion_mediana", texto: null, centimos: 1000 },
    { formato: "racion_grande", texto: null, centimos: 1200 },
  ],
  "Croqueta de jamón y cocido (sin precio: según mercado)": [{ formato: "unico", texto: null, centimos: null }],
  "Precio simple": [{ formato: "unico", texto: null, centimos: 850 }],
  "Carajillo quemao (texto libre)": [
    { formato: "otro", texto: "Con orujo", centimos: 250 },
    { formato: "otro", texto: "Con ron", centimos: 250 },
  ],
};
