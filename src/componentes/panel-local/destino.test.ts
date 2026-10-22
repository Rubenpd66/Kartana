import { describe, expect, it } from "vitest";
import { destinoDelPanel } from "./destino";

describe("destinoDelPanel", () => {
  it("sin condiciones al día va a la bienvenida, aunque tenga locales", () => {
    expect(destinoDelPanel(false, ["a"])).toEqual({ tipo: "ir", ruta: "/panel/bienvenida" });
  });
  it("sin locales va a la bienvenida", () => {
    expect(destinoDelPanel(true, [])).toEqual({ tipo: "ir", ruta: "/panel/bienvenida" });
  });
  it("con un local va a su inicio", () => {
    expect(destinoDelPanel(true, ["a"])).toEqual({ tipo: "ir", ruta: "/panel/a" });
  });
  it("con varios locales deja elegir", () => {
    expect(destinoDelPanel(true, ["a", "b"])).toEqual({ tipo: "elegir" });
  });
});
