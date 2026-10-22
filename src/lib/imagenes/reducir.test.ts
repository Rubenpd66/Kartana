import { afterEach, describe, expect, it, vi } from "vitest";
import { calcularDimensiones, reducirImagen } from "./reducir";

describe("calcularDimensiones", () => {
  it("no agranda imágenes pequeñas", () => {
    expect(calcularDimensiones(800, 600, 1200)).toEqual({ ancho: 800, alto: 600 });
  });

  it("reduce por el lado más largo manteniendo la proporción (horizontal)", () => {
    expect(calcularDimensiones(4000, 3000, 1200)).toEqual({ ancho: 1200, alto: 900 });
  });

  it("reduce por el lado más largo (vertical)", () => {
    expect(calcularDimensiones(3000, 4000, 1200)).toEqual({ ancho: 900, alto: 1200 });
  });

  it("cuadrada a 512", () => {
    expect(calcularDimensiones(2048, 2048, 512)).toEqual({ ancho: 512, alto: 512 });
  });

  it("nunca devuelve 0", () => {
    expect(calcularDimensiones(10000, 1, 100)).toEqual({ ancho: 100, alto: 1 });
  });

  it("rechaza medidas no válidas", () => {
    expect(() => calcularDimensiones(0, 100, 100)).toThrow();
    expect(() => calcularDimensiones(100, 100, 0)).toThrow();
  });
});

describe("reducirImagen", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function prepararNavegador(tipoSalida: string) {
    const drawImage = vi.fn();
    const convertToBlob = vi.fn(async (o: { type: string; quality?: number }) => new Blob(["x"], { type: tipoSalida || o.type }));
    const lienzos: Array<{ width: number; height: number }> = [];
    class LienzoFalso {
      width: number;
      height: number;
      constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
        lienzos.push(this);
      }
      getContext() {
        return { drawImage };
      }
      convertToBlob = convertToBlob;
    }
    const close = vi.fn();
    vi.stubGlobal("OffscreenCanvas", LienzoFalso);
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 4000, height: 3000, close })));
    return { drawImage, convertToBlob, lienzos, close };
  }

  it("dibuja a la medida reducida y exporta en el tipo y calidad pedidos", async () => {
    const { convertToBlob, lienzos, drawImage, close } = prepararNavegador("image/webp");
    const archivo = new File(["datos"], "foto.jpg", { type: "image/jpeg" });
    const blob = await reducirImagen(archivo, { ladoMax: 1200, tipo: "image/webp", calidad: 0.8 });
    expect(lienzos[0]).toMatchObject({ width: 1200, height: 900 });
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1200, 900);
    expect(convertToBlob).toHaveBeenCalledWith({ type: "image/webp", quality: 0.8 });
    expect(blob.type).toBe("image/webp");
    expect(close).toHaveBeenCalled();
  });

  it("si el navegador no sabe hacer WebP, cae a JPEG", async () => {
    const { convertToBlob } = prepararNavegador("");
    convertToBlob.mockResolvedValueOnce(new Blob(["x"], { type: "image/png" }));
    const archivo = new File(["datos"], "foto.jpg", { type: "image/jpeg" });
    const blob = await reducirImagen(archivo, { ladoMax: 1200, tipo: "image/webp", calidad: 0.8 });
    expect(convertToBlob).toHaveBeenLastCalledWith({ type: "image/jpeg", quality: 0.8 });
    expect(blob.type).toBe("image/jpeg");
  });

  it("rechaza archivos que no son imágenes", async () => {
    prepararNavegador("image/png");
    const archivo = new File(["<svg/>"], "x.txt", { type: "text/plain" });
    await expect(reducirImagen(archivo, { ladoMax: 512, tipo: "image/png" })).rejects.toThrow("no_es_imagen");
  });

  it("rechaza SVG (podría llevar scripts)", async () => {
    prepararNavegador("image/png");
    const archivo = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    await expect(reducirImagen(archivo, { ladoMax: 512, tipo: "image/png" })).rejects.toThrow("no_es_imagen");
  });
});
