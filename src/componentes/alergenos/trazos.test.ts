import { describe, expect, it } from "vitest";
import type { CodigoAlergeno } from "@/lib/tipos/dominio";
import { CODIGOS_ALERGENO, TRAZOS } from "./trazos";

const LOS_14: CodigoAlergeno[] = [
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
];

describe("trazos de los iconos de alérgenos", () => {
  it("hay trazo para los 14 códigos del anexo II y ninguno más", () => {
    expect(Object.keys(TRAZOS).sort()).toEqual([...LOS_14].sort());
    expect([...CODIGOS_ALERGENO].sort()).toEqual([...LOS_14].sort());
  });

  it("cada icono tiene al menos un trazo y no más de 16", () => {
    for (const codigo of LOS_14) {
      expect(TRAZOS[codigo].length, codigo).toBeGreaterThanOrEqual(1);
      expect(TRAZOS[codigo].length, codigo).toBeLessThanOrEqual(16);
    }
  });

  it("cada trazo es un camino SVG válido: empieza por M y solo usa comandos y números", () => {
    for (const codigo of LOS_14) {
      for (const d of TRAZOS[codigo]) {
        expect(d, codigo).toMatch(/^M[\d\s.,a-zA-Z-]+$/);
        expect(d, codigo).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });

  it("los iconos son distintos entre sí", () => {
    const firmas = LOS_14.map((c) => TRAZOS[c].join("|"));
    expect(new Set(firmas).size).toBe(14);
  });

  it("todos los puntos de cada trazo caen dentro del lienzo de 24×24 (con margen para el trazo)", () => {
    for (const codigo of LOS_14) {
      for (const d of TRAZOS[codigo]) {
        for (const [x, y] of puntosDelCamino(d)) {
          expect(x, `${codigo} x en «${d}»`).toBeGreaterThanOrEqual(1);
          expect(x, `${codigo} x en «${d}»`).toBeLessThanOrEqual(23);
          expect(y, `${codigo} y en «${d}»`).toBeGreaterThanOrEqual(1);
          expect(y, `${codigo} y en «${d}»`).toBeLessThanOrEqual(23);
        }
      }
    }
  });
});

/** Puntos finales (absolutos) de un camino SVG. Admite M L H V C S A Z en mayúscula y minúscula. */
function puntosDelCamino(d: string): Array<[number, number]> {
  const puntos: Array<[number, number]> = [];
  const nArgs: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, a: 7, z: 0 };
  let x = 0;
  let y = 0;
  let inicio: [number, number] = [0, 0];
  for (const [, orden, resto] of d.matchAll(/([MmLlHhVvCcSsAaZz])([^MmLlHhVvCcSsAaZz]*)/g)) {
    const minuscula = orden.toLowerCase();
    const numeros = (resto!.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
    const n = nArgs[minuscula]!;
    const relativo = orden === minuscula;
    if (n === 0) {
      [x, y] = inicio;
      continue;
    }
    for (let k = 0; k + n <= numeros.length; k += n) {
      const a = numeros.slice(k, k + n);
      if (minuscula === "h") x = relativo ? x + a[0]! : a[0]!;
      else if (minuscula === "v") y = relativo ? y + a[0]! : a[0]!;
      else {
        const [dx, dy] = [a[n - 2]!, a[n - 1]!];
        x = relativo ? x + dx : dx;
        y = relativo ? y + dy : dy;
      }
      puntos.push([x, y]);
      if (minuscula === "m" && k === 0) inicio = [x, y];
    }
  }
  return puntos;
}
