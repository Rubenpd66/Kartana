import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Plato, Seccion } from "@/lib/tipos/carta";
import { aplicarOrden, ListaCarta } from "./ListaCarta";

afterEach(cleanup);

const LOCAL = "3f1c2d4e-0000-4000-8000-000000000001";

function plato(id: string, nombre: string, extra: Partial<Plato> = {}): Plato {
  return {
    id,
    localId: LOCAL,
    seccionId: "s1",
    nombre,
    descripcion: null,
    precios: [{ id: "p1", formato: "unico", texto: null, centimos: 375 }],
    alergenos: [],
    trazas: [],
    alergenosConfirmados: true,
    etiquetas: [],
    fotoRuta: null,
    orden: 0,
    agotado: false,
    visible: true,
    traducciones: {},
    actualizadoEn: "2026-10-23T00:00:00Z",
    ...extra,
  };
}

function seccion(id: string, nombre: string, platos: Plato[], extra: Partial<Seccion> = {}) {
  return { id, localId: LOCAL, nombre, descripcion: null, orden: 0, visible: true, traducciones: {}, platos, ...extra };
}

const CARTA = [
  seccion("s1", "Tapas", [
    plato("a", "Patatas bravas", {
      precios: [
        { id: "x1", formato: "media_racion", texto: null, centimos: 225 },
        { id: "x2", formato: "racion", texto: null, centimos: 375 },
      ],
      alergenos: ["huevos"],
    }),
    plato("b", "Queso frito", { alergenosConfirmados: false, agotado: true }),
  ]),
  seccion("s2", "Postres", [], { visible: false }),
];

function acciones() {
  return {
    cambiarAgotado: vi.fn().mockResolvedValue({ ok: true, datos: undefined }),
    reordenar: vi.fn().mockResolvedValue({ ok: true, datos: undefined }),
    guardar: vi.fn(),
    borrar: vi.fn(),
  };
}

describe("aplicarOrden", () => {
  it("ordena secciones o los platos de una sección", () => {
    expect(aplicarOrden(CARTA, { tabla: "secciones", ids: ["s2", "s1"] }).map((s) => s.id)).toEqual(["s2", "s1"]);
    const r = aplicarOrden(CARTA, { tabla: "platos", seccionId: "s1", ids: ["b", "a"] });
    expect(r[0].platos.map((p) => p.id)).toEqual(["b", "a"]);
    expect(CARTA[0].platos.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("ListaCarta", () => {
  it("muestra secciones, platos, precios resumidos y avisos", () => {
    render(<ListaCarta localId={LOCAL} secciones={CARTA} acciones={acciones()} />);
    expect(screen.getByRole("heading", { level: 2, name: "Tapas" })).toBeTruthy();
    expect(screen.getByText("Oculta")).toBeTruthy();
    const precios = document.querySelector("#plato-a .text-texto-suave")?.textContent ?? "";
    expect(precios.replace(/ /g, " ")).toBe("½ 2,25 € · Ración 3,75 €");
    expect(screen.getByText("Alérgenos sin revisar")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Huevos" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Agotado: Queso frito" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("link", { name: "+ Añadir plato a «Tapas»" }).getAttribute("href")).toBe(
      `/panel/${LOCAL}/carta/plato/nuevo?seccion=s1`,
    );
  });

  it("agotado llama a la acción con el plato y el valor nuevo", async () => {
    const a = acciones();
    render(<ListaCarta localId={LOCAL} secciones={CARTA} acciones={a} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Agotado: Patatas bravas" })));
    expect(a.cambiarAgotado).toHaveBeenCalledWith({ localId: LOCAL, platoId: "a", agotado: true });
  });

  it("modo ordenar: las flechas aparecen y guardan la lista completa del grupo", async () => {
    const a = acciones();
    render(<ListaCarta localId={LOCAL} secciones={CARTA} acciones={a} />);
    expect(screen.queryByRole("button", { name: "Bajar Patatas bravas" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Bajar Patatas bravas" })));
    expect(a.reordenar).toHaveBeenCalledWith({ localId: LOCAL, tabla: "platos", ids: ["b", "a"] });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Bajar Tapas" })));
    expect(a.reordenar).toHaveBeenLastCalledWith({ localId: LOCAL, tabla: "secciones", ids: ["s2", "s1"] });
  });

  it("pliega una sección", () => {
    render(<ListaCarta localId={LOCAL} secciones={CARTA} acciones={acciones()} />);
    const titulo = within(screen.getByRole("heading", { level: 2, name: "Tapas" })).getByRole("button");
    expect(titulo.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(titulo);
    expect(titulo.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: /Patatas bravas/ })).toBeNull();
  });

  it("estado vacío amable", () => {
    render(<ListaCarta localId={LOCAL} secciones={[]} acciones={acciones()} />);
    expect(screen.getByRole("heading", { name: "Empieza tu carta" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear la primera sección" })).toBeTruthy();
  });

  it("avisa del plato guardado", () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(<ListaCarta localId={LOCAL} secciones={CARTA} acciones={acciones()} guardado="b" />);
    expect(screen.getByText("«Queso frito» guardado.")).toBeTruthy();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
