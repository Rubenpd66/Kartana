// @vitest-environment node
import { describe, expect, it } from "vitest";
import { FORMATOS_QR, generarPdf, nombreArchivoPdf } from "./generar";

const URL_PRUEBA = "https://kartana-six.vercel.app/c/demo";
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const LOCAL = { nombre: "Bar Demo", colorMarca: "#2f6b4f" };

describe("generarPdf", () => {
  for (const formato of FORMATOS_QR) {
    it(`${formato}: devuelve un PDF pequeño, sin logo y con logo`, async () => {
      const sin = await generarPdf({ formato, local: LOCAL, url: URL_PRUEBA });
      expect(sin.subarray(0, 4).toString()).toBe("%PDF");
      expect(sin.length).toBeLessThan(500_000);
      const con = await generarPdf({ formato, local: LOCAL, url: URL_PRUEBA, logo: { datos: PNG_1X1, formato: "png" } });
      expect(con.subarray(0, 4).toString()).toBe("%PDF");
    }, 20_000);

    it(`${formato}: un nombre larguísimo no lanza`, async () => {
      const nombre = "Rollito de ternera, york, calabacín, queso fresco y salsa de la casa con patatas panaderas";
      const pdf = await generarPdf({ formato, local: { ...LOCAL, nombre }, url: URL_PRUEBA });
      expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    }, 20_000);
  }
});

describe("nombreArchivoPdf", () => {
  it("usa slug y formato", () => {
    expect(nombreArchivoPdf("demo", "mesa")).toBe("kartana-demo-mesa.pdf");
  });
});
