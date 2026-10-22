import { describe, expect, it } from "vitest";
import { leerPrecios } from "./formulario-plato";

function datos(pares: Array<[string, string]>) {
  const fd = new FormData();
  for (const [k, v] of pares) fd.append(k, v);
  return fd;
}

describe("leerPrecios", () => {
  it("precio simple", () => {
    expect(leerPrecios(datos([["precios.0.formato", "unico"], ["precios.0.importe", "3,75"]]))).toEqual({
      precios: [{ formato: "unico", texto: null, centimos: 375 }],
      errores: {},
    });
  });

  it("varias variantes en orden, conservando el id de las existentes", () => {
    const r = leerPrecios(
      datos([
        ["precios.0.id", "ab12cd34"],
        ["precios.0.formato", "media_racion"],
        ["precios.0.importe", "2.25"],
        ["precios.1.formato", "racion"],
        ["precios.1.importe", "3,75"],
      ]),
    );
    expect(r.precios).toEqual([
      { id: "ab12cd34", formato: "media_racion", texto: null, centimos: 225 },
      { formato: "racion", texto: null, centimos: 375 },
    ]);
    expect(r.errores).toEqual({});
  });

  it("según mercado deja el precio en null", () => {
    const r = leerPrecios(datos([["precios.0.formato", "unico"], ["precios.0.mercado", "true"]]));
    expect(r.precios).toEqual([{ formato: "unico", texto: null, centimos: null }]);
    expect(r.errores).toEqual({});
  });

  it("formato libre lleva su texto; los demás, texto null", () => {
    const r = leerPrecios(
      datos([
        ["precios.0.formato", "otro"],
        ["precios.0.texto", "  Para compartir "],
        ["precios.0.importe", "18"],
        ["precios.1.formato", "racion"],
        ["precios.1.texto", "se ignora"],
        ["precios.1.importe", "9"],
      ]),
    );
    expect(r.precios).toEqual([
      { formato: "otro", texto: "Para compartir", centimos: 1800 },
      { formato: "racion", texto: null, centimos: 900 },
    ]);
  });

  it("errores por campo: importe vacío o mal escrito", () => {
    const r = leerPrecios(
      datos([
        ["precios.0.formato", "media_racion"],
        ["precios.0.importe", ""],
        ["precios.1.formato", "racion"],
        ["precios.1.importe", "3,755"],
      ]),
    );
    expect(r.errores).toEqual({ "precios.0.centimos": "requerido", "precios.1.centimos": "formato" });
  });

  it("sin filas: lista vacía (Zod pedirá al menos una)", () => {
    expect(leerPrecios(new FormData())).toEqual({ precios: [], errores: {} });
  });
});
