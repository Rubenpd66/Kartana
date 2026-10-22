import { describe, expect, it, vi } from "vitest";
import { resolverCarta } from "./resolver";
import { cartaPublicaEjemplo } from "./pruebas/carta-ejemplo";

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

  it("con un slug que no tiene el formato válido ni consulta la base de datos", async () => {
    const obtenerCartaPublica = vi.fn();
    const buscarSlugActual = vi.fn();
    const r = await resolverCarta("../../etc", { obtenerCartaPublica, buscarSlugActual });
    expect(r).toEqual({ tipo: "no_encontrada" });
    expect(obtenerCartaPublica).not.toHaveBeenCalled();
    expect(buscarSlugActual).not.toHaveBeenCalled();
  });
});
