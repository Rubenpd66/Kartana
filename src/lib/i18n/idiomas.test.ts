import { describe, expect, it } from "vitest";
import { conPrefijoIdioma, esIdiomaCarta, quitarPrefijoIdioma, rutaCarta } from "./idiomas";

describe("quitarPrefijoIdioma", () => {
  it("deja igual una ruta sin prefijo", () => {
    expect(quitarPrefijoIdioma("/precios")).toEqual({ idioma: "es", ruta: "/precios" });
    expect(quitarPrefijoIdioma("/")).toEqual({ idioma: "es", ruta: "/" });
  });

  it("no confunde segmentos que no son idiomas de la web", () => {
    expect(quitarPrefijoIdioma("/c/bar-pepe")).toEqual({ idioma: "es", ruta: "/c/bar-pepe" });
    expect(quitarPrefijoIdioma("/fr/precios")).toEqual({ idioma: "es", ruta: "/fr/precios" });
  });
});

describe("conPrefijoIdioma", () => {
  it("no añade prefijo para el idioma por defecto", () => {
    expect(conPrefijoIdioma("/precios", "es")).toBe("/precios");
    expect(conPrefijoIdioma("precios", "es")).toBe("/precios");
  });
});

describe("rutaCarta", () => {
  it("español sin sufijo y el resto con sufijo", () => {
    expect(rutaCarta("bar-pepe")).toBe("/c/bar-pepe");
    expect(rutaCarta("bar-pepe", "eu")).toBe("/c/bar-pepe/eu");
  });
});

describe("esIdiomaCarta", () => {
  it("acepta los 7 idiomas y rechaza otros", () => {
    for (const i of ["es", "en", "fr", "de", "ca", "eu", "gl"]) expect(esIdiomaCarta(i)).toBe(true);
    expect(esIdiomaCarta("it")).toBe(false);
  });
});
