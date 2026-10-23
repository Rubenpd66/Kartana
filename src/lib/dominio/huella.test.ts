import { describe, expect, it } from "vitest";
import { calcularHuella } from "./huella";

describe("calcularHuella", () => {
  it("son los 16 primeros hex del SHA-256 (vectores conocidos)", async () => {
    // SHA-256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    expect(await calcularHuella("abc")).toBe("ba7816bf8f01cfea");
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(await calcularHuella("")).toBe("e3b0c44298fc1c14");
  });

  it("ignora los espacios de alrededor", async () => {
    expect(await calcularHuella("  Pulpo a la gallega \n")).toBe(await calcularHuella("Pulpo a la gallega"));
    expect(await calcularHuella("   ")).toBe("e3b0c44298fc1c14");
  });

  it("da lo mismo con NFC y con NFD", async () => {
    const nfc = "Café con leña";
    const nfd = nfc.normalize("NFD");
    expect(nfd).not.toBe(nfc);
    expect(await calcularHuella(nfd)).toBe(await calcularHuella(nfc));
  });

  it("cambia si cambia una letra o una mayúscula", async () => {
    const base = await calcularHuella("Pulpo a la gallega");
    expect(await calcularHuella("Pulpo a la gallego")).not.toBe(base);
    expect(await calcularHuella("pulpo a la gallega")).not.toBe(base);
    expect(base).toMatch(/^[0-9a-f]{16}$/);
  });
});
