import { describe, expect, it } from "vitest";
import { z } from "zod";
import { erroresPorCampo, esquemaAlergenos, esquemaPrecios, textoOpcional } from "./comun";
import { PRECIOS_REALES } from "./pruebas/precios-la-guagua";

function errores(esquema: z.ZodType, valor: unknown) {
  const r = esquema.safeParse(valor);
  if (r.success) throw new Error("se esperaba un error");
  return erroresPorCampo(r.error);
}

describe("erroresPorCampo", () => {
  const esquema = z.object({
    nombre: z.string().trim().min(1).max(5),
    edad: z.number().int().min(0).max(10),
    color: z.string().regex(/^#[0-9a-f]{6}$/),
    lista: z.array(z.string()).min(1).max(1),
  });

  it("traduce cada tipo de error a un código corto", () => {
    expect(errores(esquema, { nombre: "demasiado", edad: 11, color: "rojo", lista: ["a", "b"] })).toEqual({
      nombre: "demasiado_largo",
      edad: "fuera_de_rango",
      color: "formato",
      lista: "demasiado_largo",
    });
    expect(errores(esquema, { nombre: "  ", edad: -1, color: "#000000", lista: [] })).toEqual({
      nombre: "requerido",
      edad: "fuera_de_rango",
      lista: "requerido",
    });
  });

  it("campo que falta -> requerido; decimales -> formato", () => {
    expect(errores(esquema, { edad: 1.5, color: "#000000", lista: ["a"] })).toEqual({ nombre: "requerido", edad: "formato" });
  });

  it("une rutas anidadas con puntos y se queda con el primer error", () => {
    expect(errores(esquemaPrecios, [{ formato: "otro", texto: null, centimos: -1 }])).toEqual({
      "0.centimos": "fuera_de_rango",
      "0.texto": "requerido",
    });
  });
});

describe("textoOpcional", () => {
  it("convierte la cadena vacía en null y recorta", () => {
    expect(textoOpcional(10).parse("   ")).toBeNull();
    expect(textoOpcional(10).parse("  hola ")).toBe("hola");
    expect(textoOpcional(10).parse(null)).toBeNull();
  });
});

describe("esquemaAlergenos", () => {
  it("rechaza códigos desconocidos y repetidos", () => {
    expect(esquemaAlergenos.safeParse(["gluten", "huevos"]).success).toBe(true);
    expect(errores(esquemaAlergenos, ["gluten", "gluten"])).toEqual({ "1": "duplicado" });
    expect(errores(esquemaAlergenos, ["tomate"])).toEqual({ "0": "formato" });
  });
});

describe("esquemaPrecios", () => {
  it.each(Object.entries(PRECIOS_REALES))("acepta el ejemplo real: %s", (_nombre, precios) => {
    expect(esquemaPrecios.safeParse(precios).success).toBe(true);
  });

  it("un solo precio único es válido y «según mercado» (null) también", () => {
    expect(esquemaPrecios.parse([{ formato: "unico", texto: null, centimos: 850 }])).toHaveLength(1);
    expect(esquemaPrecios.parse([{ formato: "racion", texto: null, centimos: null }])[0].centimos).toBeNull();
  });

  it("«otro» sin texto es un error", () => {
    expect(errores(esquemaPrecios, [{ formato: "otro", texto: "  ", centimos: 100 }])).toEqual({ "0.texto": "requerido" });
  });

  it("texto en un formato que no es «otro» es un error", () => {
    expect(errores(esquemaPrecios, [{ formato: "racion", texto: "grande", centimos: 100 }])).toEqual({ "0.texto": "formato" });
  });

  it("«unico» junto a otra variante es un error", () => {
    expect(
      errores(esquemaPrecios, [
        { formato: "unico", texto: null, centimos: 100 },
        { formato: "racion", texto: null, centimos: 200 },
      ]),
    ).toEqual({ "0.formato": "formato" });
  });

  it("formatos repetidos son un error salvo «otro» con textos distintos", () => {
    expect(
      errores(esquemaPrecios, [
        { formato: "racion", texto: null, centimos: 100 },
        { formato: "racion", texto: null, centimos: 200 },
      ]),
    ).toEqual({ "1.formato": "duplicado" });
    expect(
      errores(esquemaPrecios, [
        { formato: "otro", texto: "Copa", centimos: 100 },
        { formato: "otro", texto: "copa", centimos: 200 },
      ]),
    ).toEqual({ "1.formato": "duplicado" });
  });

  it("7 variantes es un error; 0 también", () => {
    const formatos = ["tapa", "pincho", "media_racion", "racion", "racion_mediana", "racion_grande", "unidad"] as const;
    const siete = formatos.map((formato) => ({ formato, texto: null, centimos: 100 }));
    expect(errores(esquemaPrecios, siete)).toEqual({ _: "demasiado_largo" });
    expect(esquemaPrecios.safeParse(siete.slice(0, 6)).success).toBe(true);
    expect(errores(esquemaPrecios, [])).toEqual({ _: "requerido" });
  });

  it("céntimos negativos, decimales o por encima de 1000 € son errores", () => {
    expect(errores(esquemaPrecios, [{ formato: "racion", texto: null, centimos: -5 }])).toEqual({ "0.centimos": "fuera_de_rango" });
    expect(errores(esquemaPrecios, [{ formato: "racion", texto: null, centimos: 12.5 }])).toEqual({ "0.centimos": "formato" });
    expect(errores(esquemaPrecios, [{ formato: "racion", texto: null, centimos: 100001 }])).toEqual({ "0.centimos": "fuera_de_rango" });
  });

  it("ids: formato corto y sin repetir", () => {
    expect(esquemaPrecios.safeParse([{ id: "ab12", formato: "racion", texto: null, centimos: 1 }]).success).toBe(true);
    expect(errores(esquemaPrecios, [{ id: "AB", formato: "racion", texto: null, centimos: 1 }])).toEqual({ "0.id": "formato" });
    expect(
      errores(esquemaPrecios, [
        { id: "ab12", formato: "racion", texto: null, centimos: 1 },
        { id: "ab12", formato: "tapa", texto: null, centimos: 1 },
      ]),
    ).toEqual({ "1.id": "duplicado" });
  });

  it("formato desconocido es un error", () => {
    expect(errores(esquemaPrecios, [{ formato: "kilo", texto: null, centimos: 1 }])).toEqual({ "0.formato": "formato" });
  });
});
