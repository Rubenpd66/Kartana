import { describe, expect, it } from "vitest";
import { comprobacionLocal, direccionPublica } from "./direccion";

describe("comprobacionLocal", () => {
  it("vacío, formato y reservado se resuelven sin red", () => {
    expect(comprobacionLocal("")).toBe("vacio");
    expect(comprobacionLocal("ab")).toBe("formato");
    expect(comprobacionLocal("Bar Pepe")).toBe("formato");
    expect(comprobacionLocal("panel")).toBe("reservado");
  });
  it("una válida necesita preguntar al servidor", () => {
    expect(comprobacionLocal("bar-pepe")).toBeNull();
  });
});

describe("direccionPublica", () => {
  it("quita protocolo y barra final", () => {
    expect(direccionPublica("https://kartana-six.vercel.app/", "bar-pepe")).toBe("kartana-six.vercel.app/c/bar-pepe");
  });
});
