import { describe, expect, it } from "vitest";
import { colorMarcaValido, colorTextoSobre, ratioContraste } from "./contraste";

describe("ratioContraste", () => {
  it("negro sobre blanco es 21:1 y es simétrico", () => {
    expect(ratioContraste("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(ratioContraste("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(ratioContraste("#777777", "#777777")).toBeCloseTo(1, 5);
  });

  it("calcula el color de marca por defecto (≈ 5,3:1)", () => {
    expect(ratioContraste("#b9461a", "#ffffff")).toBeGreaterThan(5.2);
    expect(ratioContraste("#b9461a", "#ffffff")).toBeLessThan(5.4);
  });

  it("lanza con colores mal escritos", () => {
    expect(() => ratioContraste("rojo", "#ffffff")).toThrow();
  });
});

describe("colorMarcaValido", () => {
  it("acepta colores con contraste suficiente con blanco", () => {
    expect(colorMarcaValido("#b9461a")).toBe(true);
    expect(colorMarcaValido("#000000")).toBe(true);
  });

  it("rechaza colores claros", () => {
    expect(colorMarcaValido("#f5d000")).toBe(false);
    expect(colorMarcaValido("#ffffff")).toBe(false);
  });

  it("rechaza formatos que no son #rrggbb en minúsculas", () => {
    expect(colorMarcaValido("#B9461A")).toBe(false);
    expect(colorMarcaValido("#b946")).toBe(false);
    expect(colorMarcaValido("b9461a")).toBe(false);
    expect(colorMarcaValido("")).toBe(false);
  });
});

describe("colorTextoSobre", () => {
  it("elige blanco sobre fondos oscuros y oscuro sobre fondos claros", () => {
    expect(colorTextoSobre("#b9461a")).toBe("#ffffff");
    expect(colorTextoSobre("#000000")).toBe("#ffffff");
    expect(colorTextoSobre("#f5d000")).toBe("#1f1a17");
    expect(colorTextoSobre("#ffffff")).toBe("#1f1a17");
  });

  it("acepta mayúsculas", () => {
    expect(colorTextoSobre("#F5D000")).toBe("#1f1a17");
  });
});
