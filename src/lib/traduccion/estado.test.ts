import { describe, expect, it } from "vitest";
import { estadoCampo, resumirTraducciones } from "./estado";
import { HUELLA_A, HUELLA_B, textoDe, traducido } from "./pruebas/textos-ejemplo";

describe("estadoCampo", () => {
  it("distingue los cinco estados", () => {
    const texto = textoDe("nombre", "Pulpo", {
      en: traducido("Octopus", "auto", HUELLA_A),
      fr: traducido("Poulpe", "manual", HUELLA_A),
      de: traducido("Krake", "auto", HUELLA_B),
      ca: traducido("Pop", "manual", HUELLA_B),
    });
    expect(estadoCampo(texto, "en")).toBe("al_dia_auto");
    expect(estadoCampo(texto, "fr")).toBe("al_dia_manual");
    expect(estadoCampo(texto, "de")).toBe("desactualizada_auto");
    expect(estadoCampo(texto, "ca")).toBe("desactualizada_manual");
    expect(estadoCampo(texto, "eu")).toBe("falta");
  });

  it("una automática vacía cuenta como que falta", () => {
    expect(estadoCampo(textoDe("nombre", "Pulpo", { en: traducido("", "auto", HUELLA_A) }), "en")).toBe("falta");
  });
});

describe("resumirTraducciones", () => {
  it("cuenta total, faltan y manuales desactualizadas por idioma", () => {
    const textos = [
      textoDe("nombre", "Pulpo", { en: traducido("Octopus", "auto", HUELLA_A), fr: traducido("Poulpe", "manual", HUELLA_B) }),
      textoDe("descripcion", "Con cachelos", { en: traducido("With potatoes", "auto", HUELLA_B) }),
      textoDe("notas", "Pan", { en: traducido("Bread", "manual", HUELLA_A) }),
      textoDe("vacio", "  "),
    ];
    expect(resumirTraducciones(textos, ["en", "fr"])).toEqual([
      { idioma: "en", total: 3, faltan: 1, desactualizadasManual: 0 },
      { idioma: "fr", total: 3, faltan: 2, desactualizadasManual: 1 },
    ]);
  });

  it("sin textos devuelve ceros", () => {
    expect(resumirTraducciones([], ["gl"])).toEqual([{ idioma: "gl", total: 0, faltan: 0, desactualizadasManual: 0 }]);
  });

  it("no incluye el español", () => {
    expect(resumirTraducciones([], ["es" as never, "de"]).map((r) => r.idioma)).toEqual(["de"]);
  });
});
