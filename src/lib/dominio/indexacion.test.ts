import { describe, expect, it } from "vitest";
import { idiomasIndexables, UMBRAL_TRADUCCION_INDEXAR } from "./indexacion";

const tr = (texto: string) => ({ texto, origen: "auto" as const, huella: "0123456789abcdef", fecha: "2026-11-02T10:00:00Z" });

/** n platos; los `conEn` primeros con nombre en inglés y los `conFr` primeros en francés. */
function platos(n: number, conEn: number, conFr = 0) {
  return Array.from({ length: n }, (_, i) => ({
    traducciones: {
      ...(i < conEn ? { en: { nombre: tr(`Dish ${i}`) } } : {}),
      ...(i < conFr ? { fr: { nombre: tr(`Plat ${i}`) } } : {}),
    },
  }));
}

describe("idiomasIndexables", () => {
  it("el umbral es el 90 %", () => {
    expect(UMBRAL_TRADUCCION_INDEXAR).toBe(0.9);
  });

  it("siempre incluye «es»; otro idioma solo si está activo y con >= 90 % de nombres traducidos", () => {
    expect(idiomasIndexables(["es", "en", "fr"], platos(10, 9, 8))).toEqual(["es", "en"]);
    expect(idiomasIndexables(["es", "en", "fr"], platos(10, 10, 10))).toEqual(["es", "en", "fr"]);
    // traducido pero no activo
    expect(idiomasIndexables(["es"], platos(10, 10))).toEqual(["es"]);
    expect(idiomasIndexables([], platos(10, 10))).toEqual(["es"]);
  });

  it("solo cuenta el nombre, con texto no vacío", () => {
    const lista = [
      { traducciones: { en: { descripcion: tr("Only description") } } },
      { traducciones: { en: { nombre: tr("  ") } } },
      { traducciones: { en: { nombre: { texto: 3 } } } },
      { traducciones: null },
      ...platos(6, 6),
    ];
    // 6 de 10 -> no llega
    expect(idiomasIndexables(["es", "en"], lista)).toEqual(["es"]);
  });

  it("sin platos, solo «es»; ignora idiomas desconocidos y respeta el orden de IDIOMAS_CARTA", () => {
    expect(idiomasIndexables(["es", "en"], [])).toEqual(["es"]);
    expect(idiomasIndexables(["fr", "xx", "en", "es"], platos(5, 5, 5))).toEqual(["es", "en", "fr"]);
  });
});
