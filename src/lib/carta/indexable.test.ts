import { describe, expect, it } from "vitest";
import { contarPlatos, esIdiomaIndexable, esIndexable, idiomasIndexablesCarta, PLATOS_PARA_INDEXAR } from "./indexable";
import { cartaConPlatos, cartaConTraducidos } from "./pruebas/carta-ejemplo";

describe("esIndexable", () => {
  it("pide al menos 5 platos visibles", () => {
    expect(PLATOS_PARA_INDEXAR).toBe(5);
  });

  it("4 platos -> no se indexa", () => {
    expect(esIndexable(cartaConPlatos(4))).toBe(false);
  });

  it("5 platos y permitirIndexar -> se indexa", () => {
    expect(esIndexable(cartaConPlatos(5))).toBe(true);
  });

  it("permitirIndexar false -> no se indexa aunque haya muchos platos", () => {
    expect(esIndexable(cartaConPlatos(30, false))).toBe(false);
  });

  it("cuenta los platos de todas las secciones", () => {
    const carta = cartaConPlatos(3);
    carta.secciones.push({ ...carta.secciones[0], id: "s2" });
    expect(contarPlatos(carta)).toBe(6);
    expect(esIndexable(carta)).toBe(true);
  });
});

describe("idiomas indexables de una carta", () => {
  it("89 % de los nombres traducidos -> ese idioma no se indexa", () => {
    const carta = cartaConTraducidos(100, 89);
    expect(esIdiomaIndexable(carta, "en")).toBe(false);
    expect(idiomasIndexablesCarta(carta)).toEqual(["es"]);
  });

  it("90 % -> se indexa", () => {
    const carta = cartaConTraducidos(10, 9);
    expect(esIdiomaIndexable(carta, "en")).toBe(true);
    expect(idiomasIndexablesCarta(carta)).toEqual(["es", "en"]);
  });

  it("idioma no activo -> no se indexa aunque esté traducido", () => {
    const carta = cartaConTraducidos(10, 10);
    carta.local.idiomasActivos = ["es", "fr"];
    expect(esIdiomaIndexable(carta, "en")).toBe(false);
    expect(idiomasIndexablesCarta(carta)).toEqual(["es"]);
  });

  it("si la carta no se indexa, ningún idioma se indexa", () => {
    const carta = cartaConTraducidos(10, 10, false);
    expect(idiomasIndexablesCarta(carta)).toEqual([]);
    expect(esIdiomaIndexable(carta, "es")).toBe(false);
  });
});
