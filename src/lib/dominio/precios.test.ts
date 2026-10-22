import { describe, expect, expectTypeOf, it } from "vitest";
import type { FormatoPrecio } from "@/lib/tipos/dominio";
import { esFormatoPrecio, formatearPrecio, FORMATOS_PRECIO } from "./precios";

// Intl separa el número y el símbolo con un espacio duro (U+00A0) para que no se corten de línea.
const normalizar = (texto: string) => texto.replace(/ /g, " ");

describe("formatearPrecio", () => {
  it("formatea en español", () => {
    expect(normalizar(formatearPrecio(1250, "es-ES"))).toBe("12,50 €");
    expect(normalizar(formatearPrecio(850, "es-ES"))).toBe("8,50 €");
    expect(normalizar(formatearPrecio(0, "es-ES"))).toBe("0,00 €");
    expect(normalizar(formatearPrecio(100000, "es-ES"))).toBe("1000,00 €");
  });

  it("usa un espacio duro entre número y símbolo", () => {
    expect(formatearPrecio(1250, "es-ES")).toBe("12,50 €");
  });

  it("formatea en inglés con euros", () => {
    expect(formatearPrecio(1250, "en")).toBe("€12.50");
  });

  it("acepta los locales de los diccionarios de la carta", () => {
    for (const locale of ["fr", "de", "ca", "eu", "gl"]) {
      expect(formatearPrecio(1250, locale)).toMatch(/12[,.]50/);
    }
  });
});

describe("FORMATOS_PRECIO", () => {
  it("tiene los 17 formatos y coincide con FormatoPrecio", () => {
    expect(FORMATOS_PRECIO).toHaveLength(17);
    expect(new Set(FORMATOS_PRECIO).size).toBe(17);
    expect(FORMATOS_PRECIO[0]).toBe("unico");
    expectTypeOf<(typeof FORMATOS_PRECIO)[number]>().toEqualTypeOf<FormatoPrecio>();
    expect(esFormatoPrecio("media_racion")).toBe(true);
    expect(esFormatoPrecio("media-racion")).toBe(false);
  });
});
