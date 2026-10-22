import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AccesoEfectivo, FilaAdmin } from "@/lib/tipos/cuentas";

vi.mock("@/app/(admin)/admin/acciones", () => ({
  activarPilotoAccion: vi.fn(),
  cambiarEstadoAccion: vi.fn(),
}));

const { FilaLocal } = await import("./FilaLocal");

afterEach(cleanup);

function fila(a: Partial<AccesoEfectivo>, p: Partial<FilaAdmin> = {}): FilaAdmin {
  return {
    localId: "3f2b8c1e-6a4d-4e0b-9c57-1d2e3f4a5b6c",
    nombre: "Bar Los Arcos",
    slug: "bar-los-arcos",
    publicado: true,
    correoDueno: "pepe@ejemplo.com",
    creadoEn: "2026-11-02T10:00:00Z",
    numPlatos: 42,
    acceso: { estado: "prueba", plan: "carta", activo: true, diasRestantes: 6, vigenteHasta: "2026-12-19T10:00:00Z", ...a },
    ...p,
  };
}

describe("FilaLocal", () => {
  it("enseña el estado con texto, el dueño y el enlace a la carta", () => {
    render(<FilaLocal fila={fila({})} />);
    expect(screen.getByText("Prueba · vence el 19/12/2026 (quedan 6 días)")).toBeTruthy();
    expect(screen.getByText("pepe@ejemplo.com")).toBeTruthy();
    expect(screen.getByRole("link", { name: "/c/bar-los-arcos" }).getAttribute("href")).toBe("/c/bar-los-arcos");
    expect(screen.getByRole("button", { name: "Activar piloto 60 días" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dar cortesía" })).toBeTruthy();
  });

  it("si ya es piloto, el botón principal dice «Renovar»", () => {
    render(<FilaLocal fila={fila({ estado: "piloto" })} />);
    expect(screen.getByRole("button", { name: "Renovar piloto 60 días desde hoy" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Activar piloto 60 días" })).toBeNull();
  });

  it("vencido: sin enlace a la carta y sin «Quitar acceso»", () => {
    render(<FilaLocal fila={fila({ estado: "vencido", activo: false, diasRestantes: 0 })} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button", { name: "Quitar acceso" })).toBeNull();
    expect(screen.getByText(/^Vencido el/)).toBeTruthy();
  });
});
