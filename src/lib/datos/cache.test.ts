import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearSupabaseFalso } from "./pruebas/supabase-falso";

vi.mock("server-only", () => ({}));
const nextCache = vi.hoisted(() => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/cache", () => nextCache);
const servidor = vi.hoisted(() => ({ crearClienteServidor: vi.fn(), crearClientePublico: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => servidor);
const nextServer = vi.hoisted(() => ({ after: vi.fn() }));
vi.mock("next/server", () => nextServer);
const traduccion = vi.hoisted(() => ({ traducirLocal: vi.fn() }));
vi.mock("@/lib/traduccion/traducir-local", () => traduccion);

import { ETIQUETA_LISTA_CARTAS, etiquetaCarta, etiquetaLocal, revalidarCartaFueraDeAccion, trasGuardarCarta } from "./cache";

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("etiquetas", () => {
  it("tienen el formato del contrato", () => {
    expect(etiquetaCarta("bar-pepe")).toBe("carta:bar-pepe");
    expect(etiquetaLocal(LOCAL)).toBe(`local:${LOCAL}`);
    expect(ETIQUETA_LISTA_CARTAS).toBe("cartas");
  });
});

describe("trasGuardarCarta", () => {
  it("lee el slug y actualiza la carta y el local", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: { slug: "bar-pepe" } } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    await trasGuardarCarta(LOCAL);
    expect(nextCache.updateTag.mock.calls.map((c) => c[0])).toEqual(["carta:bar-pepe", `local:${LOCAL}`]);
    expect(falso.metodosDe("locales")[0]).toContainEqual({ metodo: "eq", args: ["id", LOCAL] });
  });

  it("añade el slug anterior y la lista de cartas si se piden", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: { slug: "bar-nuevo" } } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    await trasGuardarCarta(LOCAL, { slugAnterior: "bar-viejo", listaCartas: true });
    expect(nextCache.updateTag.mock.calls.map((c) => c[0])).toEqual([
      "carta:bar-nuevo",
      `local:${LOCAL}`,
      "carta:bar-viejo",
      "cartas",
    ]);
  });

  it("si no encuentra el slug, invalida al menos el local", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: null } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    await trasGuardarCarta(LOCAL);
    expect(nextCache.updateTag.mock.calls.map((c) => c[0])).toEqual([`local:${LOCAL}`]);
  });
});

describe("revalidarCartaFueraDeAccion", () => {
  it("usa revalidateTag con expire: 0 e incluye la lista de cartas", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: { slug: "bar-pepe" } } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    await revalidarCartaFueraDeAccion(LOCAL);
    expect(nextCache.revalidateTag.mock.calls).toEqual([
      ["carta:bar-pepe", { expire: 0 }],
      [`local:${LOCAL}`, { expire: 0 }],
      ["cartas", { expire: 0 }],
    ]);
    expect(nextCache.updateTag).not.toHaveBeenCalled();
  });
});

describe("trasGuardarCarta · traducción en segundo plano", () => {
  function conLocal(idiomas: string[]) {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: { slug: "bar-pepe", idiomas_activos: idiomas } } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    return falso;
  }

  it("con la traducción apagada no programa nada", async () => {
    vi.stubEnv("TRADUCCION_ACTIVA", "false");
    conLocal(["es", "en"]);
    await trasGuardarCarta(LOCAL);
    expect(nextServer.after).not.toHaveBeenCalled();
    expect(nextCache.updateTag).toHaveBeenCalledTimes(2);
  });

  it("encendida pero sin idiomas de destino no programa nada", async () => {
    vi.stubEnv("TRADUCCION_ACTIVA", "true");
    conLocal(["es"]);
    await trasGuardarCarta(LOCAL);
    expect(nextServer.after).not.toHaveBeenCalled();
  });

  it("encendida y con idiomas, invalida y programa la traducción una sola vez", async () => {
    vi.stubEnv("TRADUCCION_ACTIVA", "true");
    const falso = conLocal(["es", "en", "fr"]);
    traduccion.traducirLocal.mockResolvedValue({ ok: true, datos: { traducidos: 2, caracteres: 10, cortadoPorCuota: false } });
    await trasGuardarCarta(LOCAL);
    expect(nextCache.updateTag.mock.calls.map((c) => c[0])).toEqual(["carta:bar-pepe", `local:${LOCAL}`]);
    expect(falso.llamadas.filter((l) => l.tabla === "locales")).toHaveLength(1);
    expect(nextServer.after).toHaveBeenCalledTimes(1);
    expect(traduccion.traducirLocal).not.toHaveBeenCalled();

    const tarea = nextServer.after.mock.calls[0]![0] as () => Promise<void>;
    await tarea();
    expect(traduccion.traducirLocal).toHaveBeenCalledTimes(1);
    expect(traduccion.traducirLocal).toHaveBeenCalledWith(LOCAL);
  });

  it("si la traducción en segundo plano falla, no lanza", async () => {
    vi.stubEnv("TRADUCCION_ACTIVA", "true");
    conLocal(["es", "de"]);
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});
    traduccion.traducirLocal.mockRejectedValue(new Error("boom"));
    await trasGuardarCarta(LOCAL);
    const tarea = nextServer.after.mock.calls[0]![0] as () => Promise<void>;
    await expect(tarea()).resolves.toBeUndefined();
    consola.mockRestore();
  });
});
