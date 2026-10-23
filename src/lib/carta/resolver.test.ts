import { describe, expect, it, vi } from "vitest";
import { resolverCarta, resolverCartaIdioma } from "./resolver";
import { cartaPublicaEjemplo } from "./pruebas/carta-ejemplo";

describe("resolverCartaIdioma", () => {
  const carta = cartaPublicaEjemplo({ local: { idiomasActivos: ["es", "en", "fr"] } });
  const deps = { obtenerCartaPublica: async () => carta, buscarSlugActual: async () => null };

  it("idioma activo -> la carta en ese idioma", async () => {
    expect(await resolverCartaIdioma("la-guagua", "en", deps)).toEqual({ tipo: "carta", carta, idioma: "en" });
  });

  it("«es» -> 404 (la española es /c/<slug>, sin duplicados)", async () => {
    const obtenerCartaPublica = vi.fn(async () => carta);
    expect(await resolverCartaIdioma("la-guagua", "es", { ...deps, obtenerCartaPublica })).toEqual({ tipo: "no_encontrada" });
    expect(obtenerCartaPublica).not.toHaveBeenCalled();
  });

  it("idioma que no es de la carta -> 404 sin consultar", async () => {
    const obtenerCartaPublica = vi.fn(async () => carta);
    for (const idioma of ["xx", "EN", "pt", "", "en/../es"]) {
      expect(await resolverCartaIdioma("la-guagua", idioma, { ...deps, obtenerCartaPublica })).toEqual({ tipo: "no_encontrada" });
    }
    expect(obtenerCartaPublica).not.toHaveBeenCalled();
  });

  it("idioma no activo en el local -> 404", async () => {
    expect(await resolverCartaIdioma("la-guagua", "de", deps)).toEqual({ tipo: "no_encontrada" });
  });

  it("carta que no existe -> 404", async () => {
    expect(await resolverCartaIdioma("no-existe", "en", { ...deps, obtenerCartaPublica: async () => null })).toEqual({
      tipo: "no_encontrada",
    });
  });

  it("slug antiguo -> redirige a la carta nueva en el mismo idioma", async () => {
    const r = await resolverCartaIdioma("bar-viejo", "fr", {
      obtenerCartaPublica: async () => null,
      buscarSlugActual: async () => "bar-nuevo",
    });
    expect(r).toEqual({ tipo: "redirigir", destino: "/c/bar-nuevo/fr" });
  });
});

describe("resolverCarta", () => {
  it("si hay carta, la devuelve sin buscar slugs antiguos", async () => {
    const carta = cartaPublicaEjemplo();
    const buscarSlugActual = vi.fn();
    const r = await resolverCarta("la-guagua", { obtenerCartaPublica: async () => carta, buscarSlugActual });
    expect(r).toEqual({ tipo: "carta", carta });
    expect(buscarSlugActual).not.toHaveBeenCalled();
  });

  it("si es un slug antiguo, redirige a la carta nueva", async () => {
    const r = await resolverCarta("bar-viejo", {
      obtenerCartaPublica: async () => null,
      buscarSlugActual: async (s) => (s === "bar-viejo" ? "bar-nuevo" : null),
    });
    expect(r).toEqual({ tipo: "redirigir", destino: "/c/bar-nuevo" });
  });

  it("si no existe, no encontrada", async () => {
    const r = await resolverCarta("no-existe-xyz", { obtenerCartaPublica: async () => null, buscarSlugActual: async () => null });
    expect(r).toEqual({ tipo: "no_encontrada" });
  });

  it("nunca redirige a sí misma", async () => {
    const r = await resolverCarta("bucle", { obtenerCartaPublica: async () => null, buscarSlugActual: async () => "bucle" });
    expect(r).toEqual({ tipo: "no_encontrada" });
  });

  it("con un slug que no tiene el formato válido ni consulta la base de datos (también con idioma)", async () => {
    const obtenerCartaPublica = vi.fn();
    const r = await resolverCartaIdioma("../x", "en", { obtenerCartaPublica, buscarSlugActual: vi.fn() });
    expect(r).toEqual({ tipo: "no_encontrada" });
    expect(obtenerCartaPublica).not.toHaveBeenCalled();
  });

  it("con un slug que no tiene el formato válido ni consulta la base de datos", async () => {
    const obtenerCartaPublica = vi.fn();
    const buscarSlugActual = vi.fn();
    const r = await resolverCarta("../../etc", { obtenerCartaPublica, buscarSlugActual });
    expect(r).toEqual({ tipo: "no_encontrada" });
    expect(obtenerCartaPublica).not.toHaveBeenCalled();
    expect(buscarSlugActual).not.toHaveBeenCalled();
  });
});
