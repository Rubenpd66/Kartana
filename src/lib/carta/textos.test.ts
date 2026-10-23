import { describe, expect, it } from "vitest";
import { cartaEn } from "@/lib/i18n/carta.en";
import { cartaEs } from "@/lib/i18n/carta.es";
import { traduccion } from "./pruebas/carta-ejemplo";
import {
  elegirEtiquetaPrecio,
  enlaceMapa,
  enlaceTelefono,
  etiquetaPrecio,
  importePrecio,
  listaDatos,
  textoDiasMenu,
  textoEn,
  textoHorarioMenu,
} from "./textos";

const sinEspaciosDuros = (s: string) => s.replace(/ /g, " ");

describe("etiquetaPrecio e importePrecio", () => {
  it("formato habitual -> etiqueta del diccionario", () => {
    expect(etiquetaPrecio({ id: "a", formato: "media_racion", texto: null, centimos: 225 }, cartaEs)).toBe("½ ración");
  });
  it("único -> sin etiqueta; otro -> el texto del dueño", () => {
    expect(etiquetaPrecio({ id: "a", formato: "unico", texto: null, centimos: 225 }, cartaEs)).toBe("");
    expect(etiquetaPrecio({ id: "a", formato: "otro", texto: "Caña", centimos: 180 }, cartaEs)).toBe("Caña");
  });
  it("importe en euros o «Según mercado»", () => {
    expect(sinEspaciosDuros(importePrecio({ id: "a", formato: "racion", texto: null, centimos: 375 }, cartaEs))).toBe("3,75 €");
    expect(importePrecio({ id: "a", formato: "racion", texto: null, centimos: null }, cartaEs)).toBe("Según mercado");
  });
});

describe("textoDiasMenu", () => {
  it("días seguidos como rango", () => {
    expect(textoDiasMenu([1, 2, 3, 4, 5], cartaEs)).toBe("Lunes a Viernes");
  });
  it("días sueltos separados por comas", () => {
    expect(textoDiasMenu([1, 3, 6, 7], cartaEs)).toBe("Lunes, Miércoles, Sábado, Domingo");
  });
  it("mezcla de rangos y sueltos, en orden aunque lleguen desordenados", () => {
    expect(textoDiasMenu([7, 1, 2, 3, 5], cartaEs)).toBe("Lunes a Miércoles, Viernes, Domingo");
  });
  it("todos los días", () => {
    expect(textoDiasMenu([1, 2, 3, 4, 5, 6, 7], cartaEs)).toBe("Lunes a Domingo");
  });
});

describe("textoHorarioMenu", () => {
  it("con horas usa la plantilla del diccionario", () => {
    expect(textoHorarioMenu({ dias: [1, 2, 3, 4, 5], horaInicio: "13:00", horaFin: "16:00" }, cartaEs)).toBe(
      "Lunes a Viernes, de 13:00 a 16:00",
    );
  });
  it("sin horas: todo el día", () => {
    expect(textoHorarioMenu({ dias: [6, 7], horaInicio: null, horaFin: null }, cartaEs)).toBe("Sábado, Domingo · Todo el día");
  });
});

describe("enlaces", () => {
  it("teléfono sin espacios ni símbolos raros", () => {
    expect(enlaceTelefono("926 00 00 00")).toBe("tel:926000000");
    expect(enlaceTelefono("+34 (926) 000-000")).toBe("tel:+34926000000");
  });
  it("teléfono sin cifras -> null", () => {
    expect(enlaceTelefono("llámanos")).toBeNull();
  });
  it("mapa de Google con la dirección codificada", () => {
    expect(enlaceMapa("Calle Mayor 1, Ciudad Real")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Calle%20Mayor%201%2C%20Ciudad%20Real",
    );
  });
});

describe("listaDatos", () => {
  it("códigos separados por espacios para los atributos data-*", () => {
    expect(listaDatos(["gluten", "huevos"])).toBe("gluten huevos");
    expect(listaDatos([])).toBe("");
  });
});

describe("textos traducidos", () => {
  const traducciones = { en: { "precio.a.texto": traduccion("Small beer"), nombre: traduccion("Beer") } };

  it("elegirEtiquetaPrecio: «otro» usa su traducción; formatos del diccionario del idioma", () => {
    expect(elegirEtiquetaPrecio({ id: "a", formato: "otro", texto: "Caña", centimos: 180 }, cartaEn, traducciones, "en")).toEqual({
      texto: "Small beer",
    });
    expect(elegirEtiquetaPrecio({ id: "b", formato: "media_racion", texto: null, centimos: 180 }, cartaEn, traducciones, "en")).toEqual({
      texto: "Half portion",
    });
  });

  it("«otro» sin traducción: el original marcado en español", () => {
    expect(elegirEtiquetaPrecio({ id: "z", formato: "otro", texto: "Caña", centimos: 180 }, cartaEn, traducciones, "en")).toEqual({
      texto: "Caña",
      lang: "es",
    });
  });

  it("textoEn: traducción o el original con lang «es»; en español nunca marca", () => {
    expect(textoEn("Cerveza", traducciones, "nombre", "en")).toEqual({ texto: "Beer" });
    expect(textoEn("Cerveza", {}, "nombre", "fr")).toEqual({ texto: "Cerveza", lang: "es" });
    expect(textoEn("Cerveza", traducciones, "nombre", "es")).toEqual({ texto: "Cerveza" });
  });
});
