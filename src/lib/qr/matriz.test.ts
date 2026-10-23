import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { crearMatriz } from "./matriz";

const URL_PRUEBA = "https://kartana-six.vercel.app/c/demo";

describe("crearMatriz", () => {
  it("tiene el mismo tamaño que QRCode.create", () => {
    const esperado = QRCode.create(URL_PRUEBA, { errorCorrectionLevel: "M" }).modules.size;
    expect(crearMatriz(URL_PRUEBA).tamano).toBe(esperado);
  });

  it("lleva el patrón de posición en tres esquinas y no en la cuarta", () => {
    const m = crearMatriz(URL_PRUEBA);
    const n = m.tamano;
    for (const [f0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]] as const) {
      for (let i = 0; i < 7; i++) {
        expect(m.oscuro(f0, c0 + i)).toBe(true);
        expect(m.oscuro(f0 + 6, c0 + i)).toBe(true);
        expect(m.oscuro(f0 + i, c0)).toBe(true);
        expect(m.oscuro(f0 + i, c0 + 6)).toBe(true);
      }
      expect(m.oscuro(f0 + 1, c0 + 1)).toBe(false);
      expect(m.oscuro(f0 + 3, c0 + 3)).toBe(true);
    }
  });

  it("fuera de la matriz es claro", () => {
    const m = crearMatriz(URL_PRUEBA);
    expect(m.oscuro(-1, 0)).toBe(false);
    expect(m.oscuro(0, m.tamano)).toBe(false);
  });

  it("rechaza un texto vacío", () => {
    expect(() => crearMatriz("")).toThrow();
  });
});
