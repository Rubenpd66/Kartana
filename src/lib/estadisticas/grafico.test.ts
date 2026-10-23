import { describe, expect, it } from "vitest";
import { calcularGrafico, escalaMaxima } from "./grafico";

const dias = (valores: number[]) =>
  valores.map((visitas, i) => ({ dia: `2026-10-${String(i + 1).padStart(2, "0")}`, visitas }));

describe("escalaMaxima", () => {
  it("sube a un número redondo", () => {
    expect(escalaMaxima(0)).toBe(4);
    expect(escalaMaxima(3)).toBe(4);
    expect(escalaMaxima(7)).toBe(8);
    expect(escalaMaxima(23)).toBe(24);
    expect(escalaMaxima(101)).toBe(120);
  });
});

describe("calcularGrafico", () => {
  it("todos los días a cero: barras sin altura y escala mínima", () => {
    const g = calcularGrafico(dias([0, 0, 0, 0, 0, 0, 0]));
    expect(g.barras).toHaveLength(7);
    expect(g.barras.every((b) => b.alto === 0)).toBe(true);
    expect(g.maximo).toBe(4);
    expect(g.hayDatos).toBe(false);
  });
  it("un pico: la barra más alta llena la escala y las demás son proporcionales", () => {
    const g = calcularGrafico(dias([0, 0, 8, 0, 4, 0, 0]));
    const [, , pico, , mitad] = g.barras;
    expect(g.maximo).toBe(8);
    expect(pico.alto).toBeCloseTo(g.altoUtil);
    expect(mitad.alto).toBeCloseTo(g.altoUtil / 2);
    expect(pico.y + pico.alto).toBeCloseTo(g.altoUtil);
    expect(g.hayDatos).toBe(true);
  });
  it("una visita suelta se ve (alto mínimo)", () => {
    const g = calcularGrafico(dias([1, 100]));
    expect(g.barras[0].alto).toBeGreaterThanOrEqual(2);
  });
  it("90 días: caben en el ancho y pocas etiquetas", () => {
    const g = calcularGrafico(dias(Array.from({ length: 90 }, (_, i) => i % 5)).map((d, i) => ({ ...d, dia: `2026-${i < 60 ? "08" : "09"}-${String((i % 28) + 1).padStart(2, "0")}` })));
    expect(g.barras).toHaveLength(90);
    const ultima = g.barras[89];
    expect(ultima.x + ultima.ancho).toBeLessThanOrEqual(g.ancho);
    expect(g.etiquetas.length).toBeLessThanOrEqual(7);
    expect(g.etiquetas.length).toBeGreaterThan(1);
  });
  it("etiquetas con día/mes", () => {
    const g = calcularGrafico(dias([1, 2, 3]));
    expect(g.etiquetas[0].texto).toBe("1/10");
  });
  it("lista vacía no rompe", () => {
    const g = calcularGrafico([]);
    expect(g.barras).toEqual([]);
  });
  it("marcas del eje Y: de 0 al máximo", () => {
    const g = calcularGrafico(dias([0, 8]));
    expect(g.marcasY.map((m) => m.valor)).toEqual([0, 4, 8]);
  });
});
