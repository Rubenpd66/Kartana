import { describe, expect, it } from "vitest";
import { cartaEs } from "@/lib/i18n/carta.es";
import { aplicarAtajo, centimosATexto, resumirPrecios, textoACentimos } from "./precios";

const sinEspacioDuro = (t: string) => t.replace(/ /g, " ");
const diccionario = { locale: cartaEs.locale, formatos: { ...cartaEs.formatos, media_racion: "½" }, segunMercado: "Según mercado" };

describe("textoACentimos", () => {
  it("acepta coma, punto y enteros", () => {
    expect(textoACentimos("3,75")).toBe(375);
    expect(textoACentimos("3.75")).toBe(375);
    expect(textoACentimos("3")).toBe(300);
    expect(textoACentimos("3,5")).toBe(350);
    expect(textoACentimos("0")).toBe(0);
    expect(textoACentimos("12,05")).toBe(1205);
  });

  it("tolera espacios y el símbolo del euro", () => {
    expect(textoACentimos(" 3,75 ")).toBe(375);
    expect(textoACentimos("3,75 €")).toBe(375);
    expect(textoACentimos("3,75€")).toBe(375);
  });

  it("no pierde céntimos por los decimales de coma flotante", () => {
    expect(textoACentimos("4,35")).toBe(435);
    expect(textoACentimos("1,10")).toBe(110);
    expect(textoACentimos("0,29")).toBe(29);
  });

  it("rechaza negativos, más de 2 decimales, vacíos y texto", () => {
    expect(textoACentimos("-3")).toBeNull();
    expect(textoACentimos("3,755")).toBeNull();
    expect(textoACentimos("")).toBeNull();
    expect(textoACentimos("   ")).toBeNull();
    expect(textoACentimos("tres")).toBeNull();
    expect(textoACentimos("3,")).toBeNull();
    expect(textoACentimos(",5")).toBeNull();
    expect(textoACentimos("1.000,50")).toBeNull();
  });
});

describe("centimosATexto", () => {
  it("escribe con coma y dos decimales", () => {
    expect(centimosATexto(375)).toBe("3,75");
    expect(centimosATexto(300)).toBe("3,00");
    expect(centimosATexto(5)).toBe("0,05");
    expect(centimosATexto(100000)).toBe("1000,00");
  });

  it("null (según mercado) es texto vacío", () => {
    expect(centimosATexto(null)).toBe("");
  });

  it("ida y vuelta", () => {
    for (const c of [0, 1, 99, 250, 1205, 99999]) expect(textoACentimos(centimosATexto(c))).toBe(c);
  });
});

describe("aplicarAtajo", () => {
  it("½ y ración crea media ración y ración, sin precio", () => {
    expect(aplicarAtajo("media_y_racion")).toEqual([
      { formato: "media_racion", texto: null, centimos: null },
      { formato: "racion", texto: null, centimos: null },
    ]);
  });

  it("los demás atajos", () => {
    expect(aplicarAtajo("mediana_y_grande").map((p) => p.formato)).toEqual(["racion_mediana", "racion_grande"]);
    expect(aplicarAtajo("por_unidad").map((p) => p.formato)).toEqual(["unidad"]);
    expect(aplicarAtajo("media_docena_y_docena").map((p) => p.formato)).toEqual(["media_docena", "docena"]);
    expect(aplicarAtajo("un_precio").map((p) => p.formato)).toEqual(["unico"]);
  });

  it("cada llamada devuelve objetos nuevos", () => {
    const a = aplicarAtajo("media_y_racion");
    a[0].centimos = 100;
    expect(aplicarAtajo("media_y_racion")[0].centimos).toBeNull();
  });
});

describe("resumirPrecios", () => {
  it("un solo precio sin etiqueta", () => {
    expect(sinEspacioDuro(resumirPrecios([{ formato: "unico", texto: null, centimos: 850 }], diccionario))).toBe("8,50 €");
  });

  it("varias variantes con su etiqueta, separadas por un punto medio", () => {
    const texto = resumirPrecios(
      [
        { formato: "media_racion", texto: null, centimos: 225 },
        { formato: "racion", texto: null, centimos: 375 },
      ],
      diccionario,
    );
    expect(sinEspacioDuro(texto)).toBe("½ 2,25 € · Ración 3,75 €");
  });

  it("formato libre usa el texto del dueño y según mercado sin precio", () => {
    const texto = resumirPrecios(
      [
        { formato: "otro", texto: "Para compartir", centimos: 1800 },
        { formato: "racion", texto: null, centimos: null },
      ],
      diccionario,
    );
    expect(sinEspacioDuro(texto)).toBe("Para compartir 18,00 € · Ración Según mercado");
  });

  it("precio único según mercado", () => {
    expect(resumirPrecios([{ formato: "unico", texto: null, centimos: null }], diccionario)).toBe("Según mercado");
  });

  it("lista vacía", () => {
    expect(resumirPrecios([], diccionario)).toBe("");
  });
});
