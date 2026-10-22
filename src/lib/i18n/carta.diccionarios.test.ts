import { describe, expect, it } from "vitest";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { cartaCa } from "./carta.ca";
import { cartaDe } from "./carta.de";
import { cartaEn } from "./carta.en";
import { cartaEs } from "./carta.es";
import { cartaEu } from "./carta.eu";
import { cartaFr } from "./carta.fr";
import { cartaGl } from "./carta.gl";

const DICCIONARIOS: Array<[string, DiccionarioCarta, string]> = [
  ["es", cartaEs, "es-ES"],
  ["en", cartaEn, "en"],
  ["fr", cartaFr, "fr"],
  ["de", cartaDe, "de"],
  ["ca", cartaCa, "ca"],
  ["eu", cartaEu, "eu"],
  ["gl", cartaGl, "gl"],
];

const CLAVES_ALERGENOS = [
  "gluten",
  "crustaceos",
  "huevos",
  "pescado",
  "cacahuetes",
  "soja",
  "lacteos",
  "frutos_cascara",
  "apio",
  "mostaza",
  "sesamo",
  "sulfitos",
  "altramuces",
  "moluscos",
];
const CLAVES_ETIQUETAS = ["vegano", "vegetariano", "sin_gluten", "sin_lactosa", "picante", "casero", "recomendado", "nuevo"];
const FORMATOS_CON_TEXTO = [
  "tapa",
  "pincho",
  "media_racion",
  "racion",
  "racion_mediana",
  "racion_grande",
  "unidad",
  "media_docena",
  "docena",
  "copa",
  "botella",
  "jarra",
  "pequeno",
  "mediano",
  "grande",
];

describe.each(DICCIONARIOS)("diccionario de la carta · %s", (_idioma, d, locale) => {
  it(`tiene el locale ${locale}`, () => {
    expect(d.locale).toBe(locale);
  });

  it("tiene los 14 alérgenos, con nombre y sin repetir", () => {
    expect(Object.keys(d.alergenos).sort()).toEqual([...CLAVES_ALERGENOS].sort());
    const nombres = Object.values(d.alergenos);
    for (const n of nombres) expect(n.trim().length).toBeGreaterThan(0);
    expect(new Set(nombres.map((n) => n.toLowerCase())).size).toBe(14);
  });

  it("tiene las 8 etiquetas, con texto y sin repetir", () => {
    expect(Object.keys(d.etiquetas).sort()).toEqual([...CLAVES_ETIQUETAS].sort());
    const nombres = Object.values(d.etiquetas);
    for (const n of nombres) expect(n.trim().length).toBeGreaterThan(0);
    expect(new Set(nombres.map((n) => n.toLowerCase())).size).toBe(nombres.length);
  });

  it("tiene todos los formatos de venta; «unico» y «otro» vacíos, el resto con texto y distinto", () => {
    expect(d.formatos.unico).toBe("");
    expect(d.formatos.otro).toBe("");
    const textos: string[] = [];
    for (const f of FORMATOS_CON_TEXTO) {
      const t = d.formatos[f as keyof typeof d.formatos];
      expect(t.trim().length, f).toBeGreaterThan(0);
      textos.push(t.toLowerCase());
    }
    expect(Object.keys(d.formatos)).toHaveLength(FORMATOS_CON_TEXTO.length + 2);
    expect(new Set(textos).size).toBe(textos.length);
  });

  it("tiene los siete días, largos y cortos (1 a 3 letras), sin repetir", () => {
    for (const mapa of [d.dias, d.diasCortos]) {
      expect(Object.keys(mapa).sort()).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
      for (const t of Object.values(mapa)) expect(t.trim().length).toBeGreaterThan(0);
      expect(new Set(Object.values(mapa)).size).toBe(7);
    }
    for (const t of Object.values(d.diasCortos)) expect(t.length).toBeLessThanOrEqual(3);
  });

  it("ningún texto obligatorio está vacío", () => {
    for (const [clave, valor] of Object.entries(d.textos)) {
      expect(typeof valor, clave).toBe("string");
      expect(valor.trim().length, clave).toBeGreaterThan(0);
    }
  });

  it("horarioMenu contiene {dias}, {inicio} y {fin}", () => {
    expect(d.textos.horarioMenu).toContain("{dias}");
    expect(d.textos.horarioMenu).toContain("{inicio}");
    expect(d.textos.horarioMenu).toContain("{fin}");
  });
});

describe("diccionario en español", () => {
  it("lleva el aviso de alérgenos literal", () => {
    expect(cartaEs.textos.avisoAlergenos).toBe("Consulte al personal sobre alérgenos");
  });

  it("usa los nombres del anexo II para los 14 alérgenos", () => {
    expect(cartaEs.alergenos.crustaceos).toBe("Crustáceos");
    expect(cartaEs.alergenos.frutos_cascara).toBe("Frutos de cáscara");
    expect(cartaEs.alergenos.moluscos).toBe("Moluscos");
    expect(cartaEs.alergenos.altramuces).toBe("Altramuces");
  });

  it("explica en la banda de demo que es una carta de ejemplo", () => {
    expect(cartaEs.textos.avisoDemo).toMatch(/^Carta de ejemplo/);
  });
});

describe("los 7 diccionarios a la vez", () => {
  it("el aviso de demostración de cada idioma es distinto (no se quedó en español)", () => {
    const avisos = DICCIONARIOS.map(([, d]) => d.textos.avisoDemo);
    expect(new Set(avisos).size).toBe(7);
  });

  it("ningún idioma deja un texto en español por copia, salvo coincidencias legítimas", () => {
    // Coincidencias legítimas con el español: «Soja», «Apio», «Mostaza», «Altramuces», «Moluscos»,
    // «Crustáceos», «Mejor» etc. Se controla que los textos de la interfaz sí difieran.
    for (const [idioma, d] of DICCIONARIOS) {
      if (idioma === "es") continue;
      expect(d.textos.avisoAlergenos, idioma).not.toBe(cartaEs.textos.avisoAlergenos);
      expect(d.textos.filtrarAlergenos, idioma).not.toBe(cartaEs.textos.filtrarAlergenos);
      expect(d.textos.hechoCon, idioma).not.toBe(cartaEs.textos.hechoCon);
    }
  });
});
