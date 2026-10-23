import { describe, expect, it } from "vitest";
import { mover } from "./orden";

describe("mover", () => {
  it("sube y baja un elemento sin tocar la lista original", () => {
    const lista = ["a", "b", "c"];
    expect(mover(lista, 1, -1)).toEqual(["b", "a", "c"]);
    expect(mover(lista, 1, 1)).toEqual(["a", "c", "b"]);
    expect(lista).toEqual(["a", "b", "c"]);
  });

  it("en los extremos no cambia nada", () => {
    expect(mover(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(mover(["a", "b"], 1, 1)).toEqual(["a", "b"]);
    expect(mover(["a"], 5, 1)).toEqual(["a"]);
  });
});
