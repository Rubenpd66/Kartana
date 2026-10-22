import { describe, expect, expectTypeOf, it } from "vitest";
import type { CodigoAlergeno, CodigoEtiqueta } from "@/lib/tipos/dominio";
import { ALERGENOS, esAlergeno } from "./alergenos";
import { ETIQUETAS, esEtiqueta } from "./etiquetas";

describe("ALERGENOS", () => {
  it("tiene los 14 códigos del anexo II, sin repetidos y en su orden", () => {
    expect(ALERGENOS).toHaveLength(14);
    expect(new Set(ALERGENOS).size).toBe(14);
    expect(ALERGENOS[0]).toBe("gluten");
    expect(ALERGENOS[13]).toBe("moluscos");
  });

  it("coincide exactamente con el tipo CodigoAlergeno", () => {
    expectTypeOf<(typeof ALERGENOS)[number]>().toEqualTypeOf<CodigoAlergeno>();
  });

  it("esAlergeno reconoce solo los códigos válidos", () => {
    expect(esAlergeno("sesamo")).toBe(true);
    expect(esAlergeno("Sésamo")).toBe(false);
    expect(esAlergeno("")).toBe(false);
  });
});

describe("ETIQUETAS", () => {
  it("tiene las 8 etiquetas sin repetidos y coincide con CodigoEtiqueta", () => {
    expect(ETIQUETAS).toHaveLength(8);
    expect(new Set(ETIQUETAS).size).toBe(8);
    expectTypeOf<(typeof ETIQUETAS)[number]>().toEqualTypeOf<CodigoEtiqueta>();
    expect(esEtiqueta("vegano")).toBe(true);
    expect(esEtiqueta("gluten")).toBe(false);
  });
});
