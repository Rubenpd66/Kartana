import { describe, expect, it } from "vitest";
import { esCorreoAdmin } from "./admin";

describe("esCorreoAdmin", () => {
  it("encuentra el correo sin importar mayúsculas ni espacios", () => {
    expect(esCorreoAdmin("Jefa@Bar.es", " otro@x.es , jefa@bar.es ")).toBe(true);
    expect(esCorreoAdmin("  jefa@bar.es ", "JEFA@BAR.ES")).toBe(true);
  });

  it("no acepta correos fuera de la lista", () => {
    expect(esCorreoAdmin("intruso@bar.es", "jefa@bar.es,otro@x.es")).toBe(false);
  });

  it("con lista vacía o sin definir nadie es admin", () => {
    expect(esCorreoAdmin("jefa@bar.es", "")).toBe(false);
    expect(esCorreoAdmin("jefa@bar.es", undefined)).toBe(false);
    expect(esCorreoAdmin("", ",,")).toBe(false);
  });

  it("no casa por subcadena", () => {
    expect(esCorreoAdmin("efa@bar.es", "jefa@bar.es")).toBe(false);
  });
});
