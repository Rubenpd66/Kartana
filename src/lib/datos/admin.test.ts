import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearSupabaseFalso } from "./pruebas/supabase-falso";
import { filaAcceso, LOCAL_ID } from "./pruebas/filas-ejemplo";

vi.mock("server-only", () => ({}));
const servidor = vi.hoisted(() => ({ crearClienteServidor: vi.fn(), crearClientePublico: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => servidor);
const cache = vi.hoisted(() => ({ trasGuardarCarta: vi.fn(async () => {}), revalidarCartaFueraDeAccion: vi.fn(async () => {}) }));
vi.mock("./cache", () => cache);

import { activarPiloto, cambiarEstadoAcceso, listarLocalesAdmin } from "./admin";

function usar(opciones: Parameters<typeof crearSupabaseFalso>[0] = {}) {
  const falso = crearSupabaseFalso(opciones);
  servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
  return falso;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listarLocalesAdmin", () => {
  it("devuelve locales con correo del dueño, acceso y número de platos", async () => {
    usar({
      tablas: {
        locales: {
          data: [
            {
              id: LOCAL_ID,
              nombre: "La Guagua",
              slug: "la-guagua",
              publicado: true,
              creado_en: "2026-10-01T10:00:00+00:00",
              perfiles: { correo: "dueno@bar.es" },
              accesos: filaAcceso({ estado: "cortesia", vigente_hasta: null }),
              platos: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
            },
          ],
        },
      },
    });
    expect(await listarLocalesAdmin()).toEqual([
      {
        localId: LOCAL_ID,
        nombre: "La Guagua",
        slug: "la-guagua",
        publicado: true,
        correoDueno: "dueno@bar.es",
        creadoEn: "2026-10-01T10:00:00+00:00",
        acceso: { estado: "cortesia", plan: "carta_resenas", activo: true, diasRestantes: null, vigenteHasta: null },
        numPlatos: 3,
      },
    ]);
  });

  it("sin sesión: lista vacía; error: lanza", async () => {
    usar({ claims: null });
    expect(await listarLocalesAdmin()).toEqual([]);
    usar({ tablas: { locales: { data: null, error: { code: "500", message: "x" } } } });
    await expect(listarLocalesAdmin()).rejects.toThrow();
  });
});

describe("activarPiloto", () => {
  it("activa el piloto e invalida la carta", async () => {
    const falso = usar({ rpc: { activar_piloto: { data: [filaAcceso({ estado: "piloto", vigente_hasta: "2099-01-01T00:00:00+00:00" })] } } });
    const r = await activarPiloto(LOCAL_ID);
    expect(r).toMatchObject({ ok: true, datos: { estado: "piloto", activo: true } });
    expect(falso.rpcs).toEqual([{ funcion: "activar_piloto", args: { p_local: LOCAL_ID } }]);
    expect(cache.revalidarCartaFueraDeAccion).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("si no es admin la función no devuelve nada: sin_permiso", async () => {
    usar({ rpc: { activar_piloto: { data: [] } } });
    expect(await activarPiloto(LOCAL_ID)).toEqual({ ok: false, error: "sin_permiso" });
    expect(cache.revalidarCartaFueraDeAccion).not.toHaveBeenCalled();
  });

  it("id malo, sin sesión y error de la base de datos", async () => {
    const falso = usar();
    expect(await activarPiloto("x")).toMatchObject({ ok: false, error: "datos_invalidos" });
    expect(falso.rpcs).toHaveLength(0);
    usar({ claims: null });
    expect(await activarPiloto(LOCAL_ID)).toEqual({ ok: false, error: "no_autenticado" });
    usar({ rpc: { activar_piloto: { data: null, error: { code: "42501", message: "x" } } } });
    expect(await activarPiloto(LOCAL_ID)).toEqual({ ok: false, error: "sin_permiso" });
  });
});

describe("cambiarEstadoAcceso", () => {
  it("cambia a cortesía", async () => {
    const falso = usar({ rpc: { cambiar_estado_acceso: { data: [filaAcceso({ estado: "cortesia", vigente_hasta: null })] } } });
    expect(await cambiarEstadoAcceso(LOCAL_ID, "cortesia")).toMatchObject({ ok: true, datos: { estado: "cortesia", activo: true } });
    expect(falso.rpcs).toEqual([{ funcion: "cambiar_estado_acceso", args: { p_local: LOCAL_ID, p_estado: "cortesia" } }]);
    expect(cache.revalidarCartaFueraDeAccion).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("rechaza estados fuera de la lista y no admin", async () => {
    usar();
    expect(await cambiarEstadoAcceso(LOCAL_ID, "piloto" as "vencido")).toMatchObject({ error: "datos_invalidos" });
    usar({ rpc: { cambiar_estado_acceso: { data: [] } } });
    expect(await cambiarEstadoAcceso(LOCAL_ID, "vencido")).toEqual({ ok: false, error: "sin_permiso" });
  });
});
