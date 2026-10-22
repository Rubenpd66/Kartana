import { describe, expect, it } from "vitest";
import { RUTA_POR_DEFECTO, validarSiguiente } from "./redireccion";

describe("validarSiguiente", () => {
  it("acepta rutas internas", () => {
    expect(validarSiguiente("/panel")).toBe("/panel");
    expect(validarSiguiente("/panel/abc/carta?x=1#y")).toBe("/panel/abc/carta?x=1#y");
  });

  it("rechaza rutas que salen de la web", () => {
    expect(validarSiguiente("//malo.com")).toBe(RUTA_POR_DEFECTO);
    expect(validarSiguiente("https://malo.com")).toBe(RUTA_POR_DEFECTO);
    expect(validarSiguiente("/\\malo.com")).toBe(RUTA_POR_DEFECTO);
    expect(validarSiguiente("/panel\\..\\x")).toBe(RUTA_POR_DEFECTO);
    expect(validarSiguiente("javascript:alert(1)")).toBe(RUTA_POR_DEFECTO);
  });

  it("rechaza vacíos, nulos y caracteres de control", () => {
    expect(validarSiguiente("")).toBe(RUTA_POR_DEFECTO);
    expect(validarSiguiente(null)).toBe(RUTA_POR_DEFECTO);
    expect(validarSiguiente(undefined)).toBe(RUTA_POR_DEFECTO);
    expect(validarSiguiente("/\t/malo.com")).toBe(RUTA_POR_DEFECTO);
    expect(validarSiguiente("/panel\n")).toBe(RUTA_POR_DEFECTO);
  });

  it("rechaza rutas larguísimas", () => {
    expect(validarSiguiente("/" + "a".repeat(600))).toBe(RUTA_POR_DEFECTO);
  });

  it("por defecto es /panel", () => {
    expect(RUTA_POR_DEFECTO).toBe("/panel");
  });
});
