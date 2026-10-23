import { describe, expect, it } from "vitest";
import { LIMITES_LOTE, partirEnLotes } from "./lotes";

const largo = (texto: string) => texto.length;

describe("partirEnLotes", () => {
  it("los límites por defecto caben en lo que admite Google (128 textos)", () => {
    expect(LIMITES_LOTE).toEqual({ maxTextos: 100, maxCaracteres: 25_000 });
  });

  it("sin elementos no hay lotes", () => {
    expect(partirEnLotes([], largo)).toEqual([]);
  });

  it("corta por número de textos", () => {
    const textos = Array.from({ length: 7 }, (_, i) => `t${i}`);
    expect(partirEnLotes(textos, largo, { maxTextos: 3, maxCaracteres: 1000 })).toEqual([
      ["t0", "t1", "t2"],
      ["t3", "t4", "t5"],
      ["t6"],
    ]);
  });

  it("corta por caracteres", () => {
    expect(partirEnLotes(["aaaa", "bbbb", "cc", "d"], largo, { maxTextos: 100, maxCaracteres: 6 })).toEqual([
      ["aaaa"],
      ["bbbb", "cc"],
      ["d"],
    ]);
  });

  it("un texto más largo que el límite va solo", () => {
    expect(partirEnLotes(["a", "x".repeat(20), "b"], largo, { maxTextos: 100, maxCaracteres: 10 })).toEqual([
      ["a"],
      ["x".repeat(20)],
      ["b"],
    ]);
  });

  it("con los límites por defecto, 250 textos cortos van en 3 lotes", () => {
    const lotes = partirEnLotes(Array.from({ length: 250 }, () => "Pulpo"), largo);
    expect(lotes.map((l) => l.length)).toEqual([100, 100, 50]);
  });
});
