import { describe, expect, it } from "vitest";
import { calcularAccesoEfectivo } from "./acceso";

const ahora = new Date("2026-10-22T12:00:00Z");

describe("calcularAccesoEfectivo", () => {
  it("prueba vigente: activa con días restantes redondeados hacia arriba", () => {
    const r = calcularAccesoEfectivo(
      { estado: "prueba", plan: "carta_resenas", vigenteHasta: "2026-11-21T12:00:00Z" },
      ahora,
    );
    expect(r).toEqual({
      estado: "prueba",
      plan: "carta_resenas",
      activo: true,
      diasRestantes: 30,
      vigenteHasta: "2026-11-21T12:00:00Z",
    });
    const casi = calcularAccesoEfectivo({ estado: "piloto", plan: "carta", vigenteHasta: "2026-10-22T13:00:00Z" }, ahora);
    expect(casi.activo).toBe(true);
    expect(casi.diasRestantes).toBe(1);
  });

  it("prueba caducada: inactiva y 0 días", () => {
    const r = calcularAccesoEfectivo({ estado: "prueba", plan: "carta_resenas", vigenteHasta: "2026-10-01T00:00:00Z" }, ahora);
    expect(r.activo).toBe(false);
    expect(r.diasRestantes).toBe(0);
  });

  it("justo en la fecha de fin ya no está activa", () => {
    const r = calcularAccesoEfectivo({ estado: "prueba", plan: "carta", vigenteHasta: ahora.toISOString() }, ahora);
    expect(r.activo).toBe(false);
  });

  it("cortesía sin fecha: activa sin días restantes", () => {
    const r = calcularAccesoEfectivo({ estado: "cortesia", plan: "carta_resenas", vigenteHasta: null }, ahora);
    expect(r).toMatchObject({ activo: true, diasRestantes: null, vigenteHasta: null });
  });

  it("vencido: nunca activo, aunque tenga fecha futura", () => {
    expect(calcularAccesoEfectivo({ estado: "vencido", plan: "carta", vigenteHasta: null }, ahora).activo).toBe(false);
    expect(
      calcularAccesoEfectivo({ estado: "vencido", plan: "carta", vigenteHasta: "2030-01-01T00:00:00Z" }, ahora).activo,
    ).toBe(false);
  });
});
