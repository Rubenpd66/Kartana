import { describe, expect, it } from "vitest";
import type { AccesoEfectivo, FilaAdmin } from "@/lib/tipos/cuentas";
import { estadoVisible, filtrarPorEstado, resumenEstados, textoVencimiento } from "./formato";

function acceso(p: Partial<AccesoEfectivo>): AccesoEfectivo {
  return { estado: "piloto", plan: "carta", activo: true, diasRestantes: 18, vigenteHasta: "2026-12-19T10:00:00Z", ...p };
}
function fila(a: Partial<AccesoEfectivo>, p: Partial<FilaAdmin> = {}): FilaAdmin {
  return { localId: "x", nombre: "L", slug: "l", publicado: true, correoDueno: "a@b.es", creadoEn: "2026-10-01T00:00:00Z", acceso: acceso(a), numPlatos: 3, ...p };
}

describe("textoVencimiento", () => {
  it("piloto con fecha", () => {
    expect(textoVencimiento(acceso({}))).toBe("Piloto · vence el 19/12/2026 (quedan 18 días)");
  });
  it("un solo día", () => {
    expect(textoVencimiento(acceso({ diasRestantes: 1 }))).toBe("Piloto · vence el 19/12/2026 (queda 1 día)");
  });
  it("cortesía sin fin", () => {
    expect(textoVencimiento(acceso({ estado: "cortesia", vigenteHasta: null, diasRestantes: null }))).toBe("Cortesía · sin fin");
  });
  it("vencido por estado", () => {
    expect(textoVencimiento(acceso({ estado: "vencido", activo: false, diasRestantes: 0 }))).toBe("Vencido el 19/12/2026");
  });
  it("caducado por fecha se muestra como vencido", () => {
    expect(textoVencimiento(acceso({ activo: false, diasRestantes: 0 }))).toBe("Vencido el 19/12/2026");
  });
});

describe("estadoVisible, resumenEstados y filtrarPorEstado", () => {
  const filas = [
    fila({ estado: "prueba" }),
    fila({ estado: "piloto" }),
    fila({ estado: "piloto", activo: false, diasRestantes: 0 }),
    fila({ estado: "cortesia", vigenteHasta: null, diasRestantes: null }, { publicado: false }),
    fila({ estado: "vencido", activo: false, diasRestantes: 0 }),
  ];
  it("caducado cuenta como vencido", () => {
    expect(estadoVisible(filas[2].acceso)).toBe("vencido");
  });
  it("resumen", () => {
    expect(resumenEstados(filas)).toEqual({ locales: 5, publicados: 4, prueba: 1, piloto: 1, vencidos: 2 });
  });
  it("filtra", () => {
    expect(filtrarPorEstado(filas, "vencido")).toHaveLength(2);
    expect(filtrarPorEstado(filas, "piloto")).toHaveLength(1);
    expect(filtrarPorEstado(filas, undefined)).toHaveLength(5);
    expect(filtrarPorEstado(filas, "basura")).toHaveLength(5);
  });
});
