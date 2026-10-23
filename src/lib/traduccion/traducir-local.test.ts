import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Local } from "@/lib/tipos/carta";
import type { TraduccionAGuardar } from "@/lib/tipos/traduccion";
import { HUELLA_A, HUELLA_B, textoDe, traducido } from "./pruebas/textos-ejemplo";

vi.mock("server-only", () => ({}));
const datos = vi.hoisted(() => ({
  listarTextosTraducibles: vi.fn(),
  guardarTraduccionesAuto: vi.fn(),
  consumirCuotaTraduccion: vi.fn(),
}));
vi.mock("@/lib/datos/traducciones", () => datos);
const panel = vi.hoisted(() => ({ obtenerLocalDelDueno: vi.fn() }));
vi.mock("@/lib/datos/panel", () => panel);
const cache = vi.hoisted(() => ({ revalidarCartaFueraDeAccion: vi.fn() }));
vi.mock("@/lib/datos/cache", () => cache);
const google = vi.hoisted(() => ({ traducirTextos: vi.fn() }));
vi.mock("./google", async (original) => ({ ...(await original<typeof import("./google")>()), traducirTextos: google.traducirTextos }));

import { ErrorTraduccion } from "./google";
import { traducirLocal } from "./traducir-local";

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";

function local(idiomasActivos: Local["idiomasActivos"]): Partial<Local> {
  return { id: LOCAL, idiomasActivos };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TRADUCCION_ACTIVA", "true");
  panel.obtenerLocalDelDueno.mockResolvedValue(local(["es", "en", "fr"]));
  datos.consumirCuotaTraduccion.mockResolvedValue(true);
  datos.guardarTraduccionesAuto.mockImplementation(async (_id: string, lote: TraduccionAGuardar[]) => ({
    ok: true,
    datos: { guardadas: lote.length },
  }));
  google.traducirTextos.mockImplementation(async (textos: string[], idioma: string) => textos.map((t) => `${idioma}:${t}`));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("traducirLocal", () => {
  it("con el interruptor apagado no hace nada", async () => {
    vi.stubEnv("TRADUCCION_ACTIVA", "false");
    expect(await traducirLocal(LOCAL)).toEqual({ ok: false, error: "servicio_apagado" });
    expect(panel.obtenerLocalDelDueno).not.toHaveBeenCalled();
    expect(datos.listarTextosTraducibles).not.toHaveBeenCalled();
    expect(google.traducirTextos).not.toHaveBeenCalled();
  });

  it("si el local no es del usuario (o no hay sesión), no_encontrado", async () => {
    panel.obtenerLocalDelDueno.mockResolvedValue(null);
    expect(await traducirLocal(LOCAL)).toEqual({ ok: false, error: "no_encontrado" });
    expect(google.traducirTextos).not.toHaveBeenCalled();
  });

  it("sin idiomas de destino activos no lee ni traduce nada", async () => {
    panel.obtenerLocalDelDueno.mockResolvedValue(local(["es"]));
    expect(await traducirLocal(LOCAL)).toEqual({ ok: true, datos: { traducidos: 0, caracteres: 0, cortadoPorCuota: false } });
    expect(datos.listarTextosTraducibles).not.toHaveBeenCalled();
  });

  it("si no hay nada pendiente, no gasta cuota ni llama a Google ni invalida", async () => {
    datos.listarTextosTraducibles.mockResolvedValue([
      textoDe("nombre", "Pulpo", { en: traducido("Octopus", "auto", HUELLA_A), fr: traducido("Poulpe", "manual", HUELLA_B) }),
    ]);
    expect(await traducirLocal(LOCAL)).toEqual({ ok: true, datos: { traducidos: 0, caracteres: 0, cortadoPorCuota: false } });
    expect(datos.consumirCuotaTraduccion).not.toHaveBeenCalled();
    expect(google.traducirTextos).not.toHaveBeenCalled();
    expect(cache.revalidarCartaFueraDeAccion).not.toHaveBeenCalled();
  });

  it("traduce lo pendiente, reserva cuota, guarda con origen auto e invalida la carta", async () => {
    datos.listarTextosTraducibles.mockResolvedValue([textoDe("nombre", "Pulpo"), textoDe("descripcion", "Con cachelos")]);
    const resultado = await traducirLocal(LOCAL);
    expect(resultado).toEqual({ ok: true, datos: { traducidos: 4, caracteres: 2 * (5 + 12), cortadoPorCuota: false } });
    expect(datos.consumirCuotaTraduccion.mock.calls).toEqual([
      [LOCAL, 17],
      [LOCAL, 17],
    ]);
    expect(google.traducirTextos.mock.calls.map((c) => c[1])).toEqual(["en", "fr"]);
    const guardado = datos.guardarTraduccionesAuto.mock.calls.flatMap((c) => c[1] as TraduccionAGuardar[]);
    expect(guardado).toContainEqual({
      tabla: "platos",
      filaId: "plato-1",
      idioma: "en",
      campo: "nombre",
      texto: "en:Pulpo",
      huella: HUELLA_A,
      origen: "auto",
    });
    expect(guardado.every((t) => t.origen === "auto")).toBe(true);
    expect(cache.revalidarCartaFueraDeAccion).toHaveBeenCalledTimes(1);
    expect(cache.revalidarCartaFueraDeAccion).toHaveBeenCalledWith(LOCAL);
  });

  it("no intenta guardar campos manuales, ni al día ni desactualizados", async () => {
    datos.listarTextosTraducibles.mockResolvedValue([
      textoDe("nombre", "Pulpo", { en: traducido("Octopus!", "manual", HUELLA_B), fr: traducido("Poulpe", "auto", HUELLA_B) }),
      textoDe("descripcion", "Con cachelos", { en: traducido("With potatoes", "manual", HUELLA_A) }),
    ]);
    await traducirLocal(LOCAL);
    const guardado = datos.guardarTraduccionesAuto.mock.calls.flatMap((c) => c[1] as TraduccionAGuardar[]);
    expect(guardado.map((t) => `${t.idioma}.${t.campo}`).sort()).toEqual(["fr.descripcion", "fr.nombre"]);
    expect(google.traducirTextos.mock.calls.map((c) => c[1])).toEqual(["fr"]);
  });

  it("se para si no queda cuota y lo marca", async () => {
    datos.listarTextosTraducibles.mockResolvedValue([textoDe("nombre", "Pulpo")]);
    datos.consumirCuotaTraduccion.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const resultado = await traducirLocal(LOCAL);
    expect(resultado).toEqual({ ok: true, datos: { traducidos: 1, caracteres: 5, cortadoPorCuota: true } });
    expect(google.traducirTextos).toHaveBeenCalledTimes(1);
    expect(datos.consumirCuotaTraduccion).toHaveBeenCalledTimes(2);
    expect(cache.revalidarCartaFueraDeAccion).toHaveBeenCalledTimes(1);
  });

  it("sin cuota desde el principio no llama a Google ni invalida", async () => {
    datos.listarTextosTraducibles.mockResolvedValue([textoDe("nombre", "Pulpo")]);
    datos.consumirCuotaTraduccion.mockResolvedValue(false);
    expect(await traducirLocal(LOCAL)).toEqual({ ok: true, datos: { traducidos: 0, caracteres: 0, cortadoPorCuota: true } });
    expect(google.traducirTextos).not.toHaveBeenCalled();
    expect(cache.revalidarCartaFueraDeAccion).not.toHaveBeenCalled();
  });

  it("si Google falla, devuelve error_servidor, invalida lo ya guardado y no registra textos", async () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});
    datos.listarTextosTraducibles.mockResolvedValue([textoDe("nombre", "Pulpo secreto")]);
    google.traducirTextos.mockResolvedValueOnce(["Secret octopus"]).mockRejectedValueOnce(new ErrorTraduccion("peticion", 503));
    expect(await traducirLocal(LOCAL)).toEqual({ ok: false, error: "error_servidor" });
    expect(cache.revalidarCartaFueraDeAccion).toHaveBeenCalledTimes(1);
    const registrado = JSON.stringify(consola.mock.calls);
    expect(registrado).not.toContain("Pulpo");
    expect(registrado).not.toContain("octopus");
    consola.mockRestore();
  });

  it("si guardar falla, devuelve ese error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    datos.listarTextosTraducibles.mockResolvedValue([textoDe("nombre", "Pulpo")]);
    datos.guardarTraduccionesAuto.mockResolvedValue({ ok: false, error: "sin_permiso" });
    expect(await traducirLocal(LOCAL)).toEqual({ ok: false, error: "sin_permiso" });
    expect(cache.revalidarCartaFueraDeAccion).not.toHaveBeenCalled();
  });

  it("parte en lotes y reserva cuota por lote", async () => {
    panel.obtenerLocalDelDueno.mockResolvedValue(local(["es", "de"]));
    datos.listarTextosTraducibles.mockResolvedValue(
      Array.from({ length: 150 }, (_, i) => textoDe(`item.${i}.nombre`, "Plato", {}, { tabla: "menus", filaId: "menu-1" })),
    );
    const resultado = await traducirLocal(LOCAL);
    expect(resultado).toEqual({ ok: true, datos: { traducidos: 150, caracteres: 750, cortadoPorCuota: false } });
    expect(google.traducirTextos.mock.calls.map((c) => (c[0] as string[]).length)).toEqual([100, 50]);
    expect(datos.consumirCuotaTraduccion.mock.calls).toEqual([
      [LOCAL, 500],
      [LOCAL, 250],
    ]);
  });
});
