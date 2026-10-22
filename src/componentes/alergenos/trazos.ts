// Trazos de los 14 iconos de alérgenos. Dibujados para Kartana (licencia propia; se ofrecen también como CC0).
// Lienzo 24×24, sin relleno, un solo color (currentColor), trazo de 1,75 y esquinas redondeadas:
// los pone IconoAlergeno.tsx. Aquí solo hay la geometría: una lista de caminos SVG (atributo `d`) por código.
// Un punto suelto se dibuja con "Mx yh.01": con los extremos redondeados queda como un círculo.

import type { CodigoAlergeno } from "@/lib/tipos/dominio";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Círculo como camino (dos arcos). */
function circulo(cx: number, cy: number, r: number): string {
  return `M${r2(cx - r)} ${r2(cy)}a${r} ${r} 0 1 0 ${r2(2 * r)} 0a${r} ${r} 0 1 0 ${r2(-2 * r)} 0Z`;
}

/** Elipse girada `grados` alrededor de su centro (semilla). */
function semilla(cx: number, cy: number, grados: number, rx = 3, ry = 1.7): string {
  const a = (grados * Math.PI) / 180;
  const dx = rx * Math.cos(a);
  const dy = rx * Math.sin(a);
  const [x1, y1, x2, y2] = [cx - dx, cy - dy, cx + dx, cy + dy].map(r2);
  return `M${x1} ${y1}A${rx} ${ry} ${grados} 1 0 ${x2} ${y2}A${rx} ${ry} ${grados} 1 0 ${x1} ${y1}Z`;
}

/** Cacahuete: dos lóbulos redondos que se cruzan, girados `grados` alrededor de (cx, cy). */
function cacahuete(cx: number, cy: number, grados: number, radio = 4.4, separacion = 3.6): string {
  const a = (grados * Math.PI) / 180;
  const girar = (x: number, y: number) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)].map(r2);
  const cintura = Math.sqrt(radio * radio - separacion * separacion);
  const [x1, y1] = girar(0, -cintura);
  const [x2, y2] = girar(0, cintura);
  return `M${x1} ${y1}A${radio} ${radio} 0 1 1 ${x2} ${y2}A${radio} ${radio} 0 1 1 ${x1} ${y1}Z`;
}

export const TRAZOS: Record<CodigoAlergeno, readonly string[]> = {
  // Espiga de trigo: tallo, dos pares de granos y el grano de la punta.
  gluten: [
    "M12 21V8",
    "M12 16c-2.5 0-4-1.2-4-3.5 2.5 0 4 1.2 4 3.5Z",
    "M12 16c2.5 0 4-1.2 4-3.5-2.5 0-4 1.2-4 3.5Z",
    "M12 11c-2.5 0-4-1.2-4-3.5 2.5 0 4 1.2 4 3.5Z",
    "M12 11c2.5 0 4-1.2 4-3.5-2.5 0-4 1.2-4 3.5Z",
    "M12 8c-1.2-1.5-1.2-3.3 0-5 1.2 1.7 1.2 3.5 0 5Z",
  ],

  // Gamba: cuerpo en media luna con segmentos, cola abierta, antena y ojo.
  crustaceos: [
    "M18.5 7.5C16 3.5 10 3 6.5 7 3.5 10.5 4.5 16 9 19 8 15.5 8 13 10.5 10.5c2-2 5-2 8-3Z",
    "M7.3 8.3 9.7 10.2M5.4 12.2l3.2.8M6.1 15.6l2.7-.8",
    "M9 19 6.5 19.8M9 19l-.4 2.6M9 19l2.4 1.6",
    "M18.5 7.5 21 4.5",
    "M15.8 6.6h.01",
  ],

  // Huevo con un brillo.
  huevos: [
    "M12 3.5c-3.6 0-6.5 5.2-6.5 10a6.5 6.5 0 0 0 13 0c0-4.8-2.9-10-6.5-10Z",
    "M9 14.5c.3 1.8 1.4 3 3 3.4",
  ],

  // Pez de perfil con ojo.
  pescado: [
    "M3.5 12C5.5 8.5 8 6.5 11 6.5c2 0 3.7 1.4 5 3.5l4.5-3v10l-4.5-3c-1.3 2.1-3 3.5-5 3.5-3 0-5.5-2-7.5-5.5Z",
    "M7.5 11.5h.01",
  ],

  // Cacahuete: dos lóbulos que se cruzan, en diagonal.
  cacahuetes: [cacahuete(12, 12, -40, 5.2, 4.2)],

  // Vaina de soja con tres granos.
  soja: [
    "M4.5 19.5C3.5 11 9 4 19.5 4.5 20 15 13 21 4.5 19.5Z",
    "M4.5 19.5 3 21",
    circulo(8.6, 15.4, 1.1),
    circulo(12, 12, 1.1),
    circulo(15.4, 8.6, 1.1),
  ],

  // Botella de leche con tapón y etiqueta.
  lacteos: [
    "M9.5 3h5v3.2c0 .8.4 1.5 1.1 2.1 1 .9 1.9 1.9 1.9 3.4V19a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-7.3c0-1.5.9-2.5 1.9-3.4.7-.6 1.1-1.3 1.1-2.1Z",
    "M9 3h6",
    "M6.5 14h11",
  ],

  // Nuez: cáscara redonda con la junta en S.
  frutos_cascara: [
    "M12 3.8c-4.5 0-8 3.6-8 8.4 0 4.6 3.4 8 8 8s8-3.4 8-8c0-4.8-3.5-8.4-8-8.4Z",
    "M12 3.8c-1.7 2.6 1.7 4.6 0 7.2s1.7 4.6 0 9.2",
    "M7.5 9.5c.3 1.5.2 3 0 4.5M16.5 9.5c-.3 1.5-.2 3 0 4.5",
  ],

  // Apio: tres tallos con hojas.
  apio: [
    "M10.3 21 8 10.5M12 21V9M13.7 21 16 10.5",
    "M8 10.5c-2-.3-3-1.7-2.7-3.7 2 .2 3 1.6 2.7 3.7Z",
    "M12 9c-1.4-1.2-1.4-3.2 0-4.8 1.4 1.6 1.4 3.6 0 4.8Z",
    "M16 10.5c2-.3 3-1.7 2.7-3.7-2 .2-3 1.6-2.7 3.7Z",
    "M9 21h6",
  ],

  // Bote de mostaza con boquilla y una línea ondulada.
  mostaza: [
    "M12 2.5 10.5 6h3Z",
    "M9.5 6h5l2.5 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19.5V10Z",
    "M7 13h10",
    "M9.5 17c.8-.9 1.7-.9 2.5 0s1.7.9 2.5 0",
  ],

  // Cinco semillas de sésamo.
  sesamo: [
    semilla(7, 7.5, -35),
    semilla(16.5, 7, 30),
    semilla(11.5, 12.5, -65),
    semilla(6.5, 17, 35),
    semilla(17, 16.5, -30),
  ],

  // Copa de vino y una molécula de dióxido de azufre (S unido a dos O).
  sulfitos: [
    "M4 3h8c0 4.6-1.6 8-4 8s-4-3.4-4-8Z",
    "M8 11v8.5",
    "M5 20.5h6",
    "M4.3 6.5h7.4",
    circulo(18, 8, 1.6),
    circulo(15, 14, 1.2),
    circulo(21, 14, 1.2),
    "M17.2 9.3 15.7 12.9M18.8 9.3l1.5 3.6",
  ],

  // Flor de altramuz: espiga cónica de florecillas apiladas, tallo y dos hojas.
  altramuces: [
    "M7.5 15c1-1.6 2.7-2.4 4.5-2.4s3.5.8 4.5 2.4",
    "M8.4 11.4c.8-1.3 2.1-2 3.6-2s2.8.7 3.6 2",
    "M9.4 8.2c.6-1 1.5-1.5 2.6-1.5s2 .5 2.6 1.5",
    "M12 6.7V3.5",
    "M12 15v6",
    "M12 21c-.5-2.7-2.6-4.3-6-4.2.2 2.7 2.4 4.2 6 4.2Z",
    "M12 21c.5-2.7 2.6-4.3 6-4.2-.2 2.7-2.4 4.2-6 4.2Z",
  ],

  // Concha (vieira): abanico con tres costillas.
  moluscos: [
    "M12 20.5 4.5 13.5C3.5 8.5 7.5 4.5 12 4.5s8.5 4 7.5 9Z",
    "M12 20V5.5",
    "M12 20 8.2 6.5",
    "M12 20l3.8-13.5",
  ],
};

/** Los 14 códigos, en el orden del anexo II del Reglamento (UE) 1169/2011. */
export const CODIGOS_ALERGENO = [
  "gluten",
  "crustaceos",
  "huevos",
  "pescado",
  "cacahuetes",
  "soja",
  "lacteos",
  "frutos_cascara",
  "apio",
  "mostaza",
  "sesamo",
  "sulfitos",
  "altramuces",
  "moluscos",
] as const satisfies readonly CodigoAlergeno[];
