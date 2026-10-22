import { describe, expect, it } from "vitest";
import type { CampoTraduciblePlato, Traducciones } from "@/lib/tipos/dominio";
import { elegirTexto } from "./traducir";

const traducciones: Traducciones<CampoTraduciblePlato> = {
  en: {
    nombre: { texto: "Galician-style octopus", origen: "auto", huella: "9f2c1a0b7d3e4f51", fecha: "2026-11-02T10:00:00Z" },
    descripcion: { texto: "   ", origen: "auto", huella: "0000000000000000", fecha: "2026-11-02T10:00:00Z" },
  },
};

describe("elegirTexto", () => {
  it("devuelve la traducción si existe", () => {
    expect(elegirTexto("Pulpo a la gallega", traducciones, "nombre", "en")).toEqual({
      texto: "Galician-style octopus",
      esOriginal: false,
    });
  });

  it("devuelve el original y esOriginal si falta la traducción", () => {
    expect(elegirTexto("Pulpo a la gallega", traducciones, "nombre", "fr")).toEqual({
      texto: "Pulpo a la gallega",
      esOriginal: true,
    });
    expect(elegirTexto("Pulpo a la gallega", {}, "nombre", "de")).toEqual({ texto: "Pulpo a la gallega", esOriginal: true });
  });

  it("ignora traducciones vacías", () => {
    expect(elegirTexto("Con cachelos", traducciones, "descripcion", "en")).toEqual({ texto: "Con cachelos", esOriginal: true });
  });

  it("en español devuelve siempre el original sin marcarlo", () => {
    expect(elegirTexto("Pulpo a la gallega", traducciones, "nombre", "es")).toEqual({
      texto: "Pulpo a la gallega",
      esOriginal: false,
    });
  });
});
