import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearSupabaseFalso } from "./pruebas/supabase-falso";

vi.mock("server-only", () => ({}));
const nextCache = vi.hoisted(() => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/cache", () => nextCache);
const servidor = vi.hoisted(() => ({ crearClienteServidor: vi.fn(), crearClientePublico: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => servidor);

import { ETIQUETA_LISTA_CARTAS, etiquetaCarta, etiquetaLocal, revalidarCartaFueraDeAccion, trasGuardarCarta } from "./cache";

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";

beforeEach(() => {
  vi.clearAllMocks();
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
