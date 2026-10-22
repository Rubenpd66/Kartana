import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearSupabaseFalso } from "./pruebas/supabase-falso";
import { filaAcceso, filaLocal, filaMenu, filaPlato, filaSeccion, LOCAL_ID, MENU_ID, PLATO_ID, USUARIO_ID } from "./pruebas/filas-ejemplo";

vi.mock("server-only", () => ({}));
const servidor = vi.hoisted(() => ({ crearClienteServidor: vi.fn(), crearClientePublico: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => servidor);

import {
  comprobarSlug,
  listarMisLocales,
  obtenerAccesoDelLocal,
  obtenerCartaDelDueno,
  obtenerLocalDelDueno,
  obtenerMenuDelDueno,
  obtenerPlatoDelDueno,
} from "./panel";

function usar(falso: ReturnType<typeof crearSupabaseFalso>) {
  servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
  return falso;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listarMisLocales", () => {
  it("lista los locales del usuario con su acceso efectivo", async () => {
    const falso = usar(
      crearSupabaseFalso({
        tablas: {
          locales: { data: [{ id: LOCAL_ID, slug: "la-guagua", nombre: "La Guagua", publicado: true, accesos: filaAcceso({ estado: "cortesia", vigente_hasta: null }) }] },
        },
      }),
    );
    const locales = await listarMisLocales();
    expect(locales).toEqual([
      {
        id: LOCAL_ID,
        slug: "la-guagua",
        nombre: "La Guagua",
        publicado: true,
        acceso: { estado: "cortesia", plan: "carta_resenas", activo: true, diasRestantes: null, vigenteHasta: null },
      },
    ]);
    // filtra por dueño: con la sesión también se ven las cartas publicadas de otros
    expect(falso.metodosDe("locales")[0]).toContainEqual({ metodo: "eq", args: ["dueno_id", USUARIO_ID] });
  });

  it("sin acceso guardado cuenta como vencido; sin sesión, lista vacía", async () => {
    usar(crearSupabaseFalso({ tablas: { locales: { data: [{ id: LOCAL_ID, slug: "x-y-z", nombre: "X", publicado: false, accesos: null }] } } }));
    expect((await listarMisLocales())[0].acceso.activo).toBe(false);
    usar(crearSupabaseFalso({ claims: null }));
    expect(await listarMisLocales()).toEqual([]);
  });
});

describe("obtenerLocalDelDueno", () => {
  it("devuelve el local si es del usuario", async () => {
    const falso = usar(crearSupabaseFalso({ tablas: { locales: { data: filaLocal() } } }));
    const local = await obtenerLocalDelDueno(LOCAL_ID);
    expect(local?.slug).toBe("la-guagua");
    expect(falso.metodosDe("locales")[0]).toEqual(
      expect.arrayContaining([
        { metodo: "eq", args: ["id", LOCAL_ID] },
        { metodo: "eq", args: ["dueno_id", USUARIO_ID] },
      ]),
    );
  });

  it("null si no existe, si el id es malo o sin sesión", async () => {
    usar(crearSupabaseFalso({ tablas: { locales: { data: null } } }));
    expect(await obtenerLocalDelDueno(LOCAL_ID)).toBeNull();
    const falso = usar(crearSupabaseFalso());
    expect(await obtenerLocalDelDueno("no-es-uuid")).toBeNull();
    expect(falso.llamadas).toHaveLength(0);
    usar(crearSupabaseFalso({ claims: null }));
    expect(await obtenerLocalDelDueno(LOCAL_ID)).toBeNull();
  });
});

describe("obtenerCartaDelDueno", () => {
  it("trae todo, también lo oculto, ordenado", async () => {
    usar(
      crearSupabaseFalso({
        tablas: {
          locales: {
            data: {
              ...filaLocal(),
              accesos: [filaAcceso()],
              secciones: [
                { ...filaSeccion({ id: "s2", orden: 1, visible: false }), platos: [] },
                {
                  ...filaSeccion({ id: "s1", orden: 0 }),
                  platos: [filaPlato({ id: "p2", orden: 1, visible: false }), filaPlato({ id: "p1", orden: 0 })],
                },
              ],
              menus: [filaMenu({ id: "m2", orden: 1, visible: false }), filaMenu({ id: "m1", orden: 0 })],
            },
          },
        },
      }),
    );
    const carta = await obtenerCartaDelDueno(LOCAL_ID);
    expect(carta?.local.id).toBe(LOCAL_ID);
    expect(carta?.acceso.activo).toBe(true);
    expect(carta?.secciones.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(carta?.secciones[0].platos.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(carta?.menus.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("null si no es suyo", async () => {
    usar(crearSupabaseFalso({ tablas: { locales: { data: null } } }));
    expect(await obtenerCartaDelDueno(LOCAL_ID)).toBeNull();
  });
});

describe("obtenerPlatoDelDueno y obtenerMenuDelDueno", () => {
  it("comprueban que el local es del usuario antes de leer", async () => {
    const falso = usar(crearSupabaseFalso({ tablas: { locales: { data: { id: LOCAL_ID } }, platos: { data: filaPlato() } } }));
    expect((await obtenerPlatoDelDueno(LOCAL_ID, PLATO_ID))?.id).toBe(PLATO_ID);
    expect(falso.metodosDe("locales")[0]).toContainEqual({ metodo: "eq", args: ["dueno_id", USUARIO_ID] });
    expect(falso.metodosDe("platos")[0]).toEqual(
      expect.arrayContaining([
        { metodo: "eq", args: ["id", PLATO_ID] },
        { metodo: "eq", args: ["local_id", LOCAL_ID] },
      ]),
    );
  });

  it("null si el local no es suyo (ni siquiera consulta el plato)", async () => {
    const falso = usar(crearSupabaseFalso({ tablas: { locales: { data: null } } }));
    expect(await obtenerPlatoDelDueno(LOCAL_ID, PLATO_ID)).toBeNull();
    expect(falso.metodosDe("platos")).toHaveLength(0);
    expect(await obtenerMenuDelDueno(LOCAL_ID, MENU_ID)).toBeNull();
  });

  it("menú", async () => {
    usar(crearSupabaseFalso({ tablas: { locales: { data: { id: LOCAL_ID } }, menus: { data: filaMenu() } } }));
    expect((await obtenerMenuDelDueno(LOCAL_ID, MENU_ID))?.horaInicio).toBe("13:00");
  });
});

describe("obtenerAccesoDelLocal", () => {
  it("calcula el acceso efectivo", async () => {
    usar(crearSupabaseFalso({ tablas: { accesos: { data: filaAcceso({ estado: "vencido", vigente_hasta: "2020-01-01T00:00:00Z" }) } } }));
    expect(await obtenerAccesoDelLocal(LOCAL_ID)).toMatchObject({ estado: "vencido", activo: false, diasRestantes: 0 });
    usar(crearSupabaseFalso({ tablas: { accesos: { data: null } } }));
    expect(await obtenerAccesoDelLocal(LOCAL_ID)).toBeNull();
  });
});

describe("comprobarSlug", () => {
  it("formato y reservados sin consultar", async () => {
    const falso = usar(crearSupabaseFalso());
    expect(await comprobarSlug("Bar Pepe")).toEqual({ disponible: false, motivo: "formato" });
    expect(await comprobarSlug("admin")).toEqual({ disponible: false, motivo: "reservado" });
    expect(falso.rpcs).toHaveLength(0);
  });

  it("pregunta a slug_ocupado (mira locales y slugs anteriores de otros locales)", async () => {
    const falso = usar(crearSupabaseFalso({ rpc: { slug_ocupado: [{ data: true }, { data: false }] } }));
    expect(await comprobarSlug("bar-pepe")).toEqual({ disponible: false, motivo: "ocupado" });
    expect(await comprobarSlug("bar-pepe", LOCAL_ID)).toEqual({ disponible: true });
    expect(falso.rpcs).toEqual([
      { funcion: "slug_ocupado", args: { p_slug: "bar-pepe", p_local: null } },
      { funcion: "slug_ocupado", args: { p_slug: "bar-pepe", p_local: LOCAL_ID } },
    ]);
  });

  it("lanza si falla la consulta", async () => {
    usar(crearSupabaseFalso({ rpc: { slug_ocupado: { data: null, error: { code: "500", message: "x" } } } }));
    await expect(comprobarSlug("bar-pepe")).rejects.toThrow();
  });
});
