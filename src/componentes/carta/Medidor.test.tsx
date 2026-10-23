import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Medidor } from "./Medidor";

// IntersectionObserver simulado: guardamos el callback para «mover» platos dentro y fuera de pantalla.
type Callback = (entradas: Array<{ target: Element; isIntersecting: boolean }>) => void;
let observar: Callback = () => {};
const opciones: unknown[] = [];

class ObservadorFalso {
  constructor(cb: Callback, opts: unknown) {
    observar = cb;
    opciones.push(opts);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const beacon = vi.fn((url: string, datos: Blob) => {
  void url;
  void datos;
  return true;
});

async function cuerpos() {
  return Promise.all(beacon.mock.calls.map(async ([url, blob]) => ({ url, tipo: blob.type, json: JSON.parse(await blob.text()) })));
}

function platos(n: number) {
  document.body.innerHTML = Array.from({ length: n }, (_, i) => `<article data-plato-id="p${i}"></article>`).join("");
  return [...document.querySelectorAll("[data-plato-id]")];
}

function ocultar() {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
  document.dispatchEvent(new Event("visibilitychange"));
}

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";

beforeEach(() => {
  vi.useFakeTimers();
  beacon.mockClear();
  opciones.length = 0;
  vi.stubGlobal("IntersectionObserver", ObservadorFalso);
  Object.defineProperty(navigator, "sendBeacon", { configurable: true, writable: true, value: beacon });
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Medidor", () => {
  it("envía una visita al montarse con sendBeacon y JSON", async () => {
    render(<Medidor localId={LOCAL} idioma="en" modo="publica" />);
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(await cuerpos()).toEqual([
      { url: "/api/e", tipo: "application/json", json: { tipo: "visita", localId: LOCAL, idioma: "en", platos: [] } },
    ]);
  });

  it("observa con umbral 0,5 y apunta solo los platos visibles al menos 1 s, sin repetidos", async () => {
    const [a, b, c] = platos(3);
    render(<Medidor localId={LOCAL} idioma="es" modo="publica" />);
    expect(opciones[0]).toMatchObject({ threshold: 0.5 });

    act(() => observar([{ target: a, isIntersecting: true }, { target: b, isIntersecting: true }]));
    vi.advanceTimersByTime(500);
    act(() => observar([{ target: b, isIntersecting: false }])); // b: medio segundo, no cuenta
    vi.advanceTimersByTime(600); // a: 1,1 s, cuenta
    act(() => observar([{ target: a, isIntersecting: false }, { target: c, isIntersecting: true }]));
    act(() => observar([{ target: a, isIntersecting: true }])); // a otra vez: sin repetir
    vi.advanceTimersByTime(1000);

    ocultar();
    const enviados = await cuerpos();
    expect(enviados).toHaveLength(2);
    expect(enviados[1].json).toEqual({ tipo: "vistas", localId: LOCAL, idioma: "es", platos: ["p0", "p2"] });
  });

  it("como mucho 100 platos por lote", async () => {
    const lista = platos(130);
    render(<Medidor localId={LOCAL} idioma="es" modo="publica" />);
    act(() => observar(lista.map((target) => ({ target, isIntersecting: true }))));
    vi.advanceTimersByTime(1000);
    ocultar();
    const enviados = await cuerpos();
    expect(enviados[1].json.platos).toHaveLength(100);
  });

  it("envía las vistas una sola vez (visibilitychange y pagehide)", async () => {
    const [a] = platos(1);
    render(<Medidor localId={LOCAL} idioma="es" modo="publica" />);
    act(() => observar([{ target: a, isIntersecting: true }]));
    vi.advanceTimersByTime(1000);
    ocultar();
    window.dispatchEvent(new Event("pagehide"));
    ocultar();
    expect(beacon).toHaveBeenCalledTimes(2);
  });

  it("también envía con pagehide", async () => {
    const [a] = platos(1);
    render(<Medidor localId={LOCAL} idioma="es" modo="publica" />);
    act(() => observar([{ target: a, isIntersecting: true }]));
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event("pagehide"));
    expect((await cuerpos())[1].json.tipo).toBe("vistas");
  });

  it("en la vista previa no hace nada", () => {
    const [a] = platos(1);
    render(<Medidor localId={LOCAL} idioma="es" modo="vista_previa" />);
    expect(opciones).toHaveLength(0);
    void a;
    ocultar();
    expect(beacon).not.toHaveBeenCalled();
  });

  it("sin sendBeacon no hace nada", () => {
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, writable: true, value: undefined });
    expect(() => render(<Medidor localId={LOCAL} idioma="es" modo="publica" />)).not.toThrow();
    expect(opciones).toHaveLength(0);
  });

  it("no toca cookies ni almacenamiento", () => {
    const cookie = vi.spyOn(document, "cookie", "set");
    const leerCookie = vi.spyOn(document, "cookie", "get");
    const guardar = vi.spyOn(Storage.prototype, "setItem");
    const leer = vi.spyOn(Storage.prototype, "getItem");
    const [a] = platos(1);
    render(<Medidor localId={LOCAL} idioma="es" modo="publica" />);
    act(() => observar([{ target: a, isIntersecting: true }]));
    vi.advanceTimersByTime(1000);
    ocultar();
    expect(cookie).not.toHaveBeenCalled();
    expect(leerCookie).not.toHaveBeenCalled();
    expect(guardar).not.toHaveBeenCalled();
    expect(leer).not.toHaveBeenCalled();
  });

  it("no pinta nada", () => {
    const { container } = render(<Medidor localId={LOCAL} idioma="es" modo="publica" />);
    expect(container.innerHTML).toBe("");
  });
});
