import { describe, expect, it } from "vitest";
import { normalizarSlug, SLUG_DEMO, SLUGS_RESERVADOS, validarSlug } from "./slugs";

describe("normalizarSlug", () => {
  it("quita apóstrofos y signos y une con guiones", () => {
    expect(normalizarSlug("Bar Pepe's & Co.")).toBe("bar-pepes-co");
    expect(normalizarSlug("Bar Pepe's")).toBe("bar-pepes");
  });

  it("quita acentos y convierte la ñ en n", () => {
    expect(normalizarSlug("Mesón El Añejo")).toBe("meson-el-anejo");
    expect(normalizarSlug("Cafetería La Guagua")).toBe("cafeteria-la-guagua");
    expect(normalizarSlug("Xàtiva · Çà")).toBe("xativa-ca");
  });

  it("no deja guiones al principio, al final ni dobles", () => {
    expect(normalizarSlug("  --Hola   mundo--  ")).toBe("hola-mundo");
    expect(normalizarSlug("a -- b")).toBe("a-b");
  });

  it("recorta a 40 caracteres sin dejar guion final", () => {
    const largo = normalizarSlug("Restaurante de la abuela María en la plaza mayor de Toledo");
    expect(largo.length).toBeLessThanOrEqual(40);
    expect(largo.endsWith("-")).toBe(false);
    expect(largo.startsWith("restaurante-de-la-abuela-maria")).toBe(true);
  });

  it("devuelve cadena vacía si no queda nada", () => {
    expect(normalizarSlug("¡¡!!")).toBe("");
  });
});

describe("validarSlug", () => {
  it("acepta slugs con buen formato", () => {
    expect(validarSlug("bar-pepe")).toEqual({ valido: true });
    expect(validarSlug("abc")).toEqual({ valido: true });
    expect(validarSlug("a".repeat(40))).toEqual({ valido: true });
  });

  it("rechaza formatos malos", () => {
    for (const malo of ["ab", "a".repeat(41), "Bar", "-bar", "bar-", "bar--pepe", "bar pepe", "bar_pepe", "", "ñandu"]) {
      expect(validarSlug(malo), malo).toEqual({ valido: false, motivo: "formato" });
    }
  });

  it("rechaza los reservados", () => {
    for (const reservado of ["admin", "panel", "demo", "api", "cartas", "privacidad", "kartana"]) {
      expect(validarSlug(reservado), reservado).toEqual({ valido: false, motivo: "reservado" });
    }
  });

  it("la lista de reservados coincide con la arquitectura", () => {
    expect(SLUGS_RESERVADOS).toContain("_next");
    expect(SLUGS_RESERVADOS).toContain(SLUG_DEMO);
    expect(SLUGS_RESERVADOS).toHaveLength(33);
    expect(new Set(SLUGS_RESERVADOS).size).toBe(SLUGS_RESERVADOS.length);
    expect(SLUG_DEMO).toBe("demo");
  });
});
