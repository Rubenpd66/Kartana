import { describe, expect, it } from "vitest";
import { idiomaVistaPrevia } from "./idioma-vista-previa";

describe("idiomaVistaPrevia", () => {
  const activos = ["es", "en", "fr"] as const;

  it("un idioma activo se usa tal cual", () => {
    expect(idiomaVistaPrevia("fr", activos)).toBe("fr");
  });

  it("sin parámetro, vacío, desconocido o no activo -> español", () => {
    for (const valor of [undefined, "", "xx", "de", "EN"]) expect(idiomaVistaPrevia(valor, activos)).toBe("es");
  });

  it("si llega repetido (?idioma=en&idioma=fr), el primero", () => {
    expect(idiomaVistaPrevia(["en", "fr"], activos)).toBe("en");
  });
});
