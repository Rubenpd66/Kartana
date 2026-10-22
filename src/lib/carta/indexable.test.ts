import { describe, expect, it } from "vitest";
import { contarPlatos, esIndexable, PLATOS_PARA_INDEXAR } from "./indexable";
import { cartaConPlatos } from "./pruebas/carta-ejemplo";

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
