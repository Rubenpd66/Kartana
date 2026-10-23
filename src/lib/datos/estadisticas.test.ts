import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCAL_ID, PLATO_ID } from "./pruebas/filas-ejemplo";

vi.mock("server-only", () => ({}));
const servidor = vi.hoisted(() => ({ crearClienteServidor: vi.fn(), crearClientePublico: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => servidor);

import { obtenerResumenEstadisticas, registrarEvento } from "./estadisticas";

type Respuesta = { data?: unknown; error?: { code?: string; message?: string } | null };

/** Cliente simulado: cualquier método de consulta encadena; al hacer await responde lo preparado por tabla o rpc. */
function clienteFalso(opciones: { tablas?: Record<string, Respuesta>; rpc?: Record<string, Respuesta | Error> } = {}) {
  const consultas: Array<{ tabla: string; metodos: Array<{ metodo: string; args: unknown[] }> }> = [];
  const rpcs: Array<{ funcion: string; args: unknown }> = [];
  const cliente = {
    from(tabla: string) {
      const registro = { tabla, metodos: [] as Array<{ metodo: string; args: unknown[] }> };
      consultas.push(registro);
      const consulta: object = new Proxy(
        {},
        {
          get(_, clave: string) {
            if (clave === "then") {
              return (resolver: (r: Respuesta) => unknown) =>
                Promise.resolve({ data: null, error: null, ...opciones.tablas?.[tabla] }).then(resolver);
            }
            return (...args: unknown[]) => {
              registro.metodos.push({ metodo: clave, args });
              return consulta;
            };
          },
        },
      );
      return consulta;
    },
    async rpc(funcion: string, args?: unknown) {
      rpcs.push({ funcion, args });
      const r = opciones.rpc?.[funcion];
      if (r instanceof Error) throw r;
      return { data: null, error: null, ...r };
    },
  };
  return { cliente, consultas, rpcs };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.useRealTimers());

describe("registrarEvento", () => {
  it("llama a registrar_estadisticas con el cliente público", async () => {
    const falso = clienteFalso();
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    await registrarEvento({ tipo: "vistas", localId: LOCAL_ID, idioma: "en", platos: [PLATO_ID, PLATO_ID] });
    expect(falso.rpcs).toEqual([
      { funcion: "registrar_estadisticas", args: { p_local: LOCAL_ID, p_tipo: "vistas", p_idioma: "en", p_platos: [PLATO_ID] } },
    ]);
    expect(servidor.crearClienteServidor).not.toHaveBeenCalled();
  });

  it("descarta eventos inválidos sin llamar", async () => {
    const falso = clienteFalso();
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    await registrarEvento({ tipo: "visita", localId: "x", idioma: "es", platos: [] });
    await registrarEvento({ tipo: "resena" as never, localId: LOCAL_ID, idioma: "es", platos: [] });
    expect(falso.rpcs).toHaveLength(0);
  });

  it("nunca lanza: traga los errores y no registra datos del visitante", async () => {
    servidor.crearClientePublico.mockReturnValue(clienteFalso({ rpc: { registrar_estadisticas: { error: { code: "500", message: "caído" } } } }).cliente);
    await expect(registrarEvento({ tipo: "visita", localId: LOCAL_ID, idioma: "es", platos: [] })).resolves.toBeUndefined();
    servidor.crearClientePublico.mockReturnValue(clienteFalso({ rpc: { registrar_estadisticas: new Error("red") } }).cliente);
    await expect(registrarEvento({ tipo: "visita", localId: LOCAL_ID, idioma: "es", platos: [] })).resolves.toBeUndefined();
    servidor.crearClientePublico.mockImplementation(() => {
      throw new Error("sin variables");
    });
    await expect(registrarEvento({ tipo: "visita", localId: LOCAL_ID, idioma: "es", platos: [] })).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
    for (const llamada of vi.mocked(console.error).mock.calls) expect(JSON.stringify(llamada)).not.toContain(LOCAL_ID);
  });
});

describe("obtenerResumenEstadisticas", () => {
  it("rellena los días a cero, suma totales y trae el top de platos", async () => {
    // 23/10/2026 a las 23:30 en Madrid = 21:30 UTC: el día de hoy es el 23
    vi.useFakeTimers({ now: new Date("2026-10-23T21:30:00Z"), toFake: ["Date"] });
    const falso = clienteFalso({
      tablas: {
        estadisticas_dia: {
          data: [
            { dia: "2026-10-21", visitas: 5, visitas_por_idioma: { es: 3, en: 2, xx: 9, fr: "mal" }, clics_resena: 1 },
            { dia: "2026-10-23", visitas: 2, visitas_por_idioma: { de: 2 }, clics_resena: 0 },
          ],
        },
      },
      rpc: {
        platos_mas_vistos: {
          data: [
            { plato_id: PLATO_ID, nombre: "Pulpo a la gallega", vistas: 12 },
            { plato_id: "b2222222-1111-4111-8111-111111111111", nombre: "Navajas", vistas: "7" },
          ],
        },
      },
    });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);

    const r = await obtenerResumenEstadisticas(LOCAL_ID, 7);

    expect(r.desde).toBe("2026-10-17");
    expect(r.hasta).toBe("2026-10-23");
    expect(r.dias.map((d) => d.dia)).toEqual([
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
    ]);
    expect(r.dias[0]).toEqual({ dia: "2026-10-17", visitas: 0, clicsResena: 0, visitasPorIdioma: {} });
    expect(r.dias[4]).toEqual({ dia: "2026-10-21", visitas: 5, clicsResena: 1, visitasPorIdioma: { es: 3, en: 2 } });
    expect(r.totalVisitas).toBe(7);
    expect(r.totalClicsResena).toBe(1);
    expect(r.platosMasVistos).toEqual([
      { platoId: PLATO_ID, nombre: "Pulpo a la gallega", vistas: 12 },
      { platoId: "b2222222-1111-4111-8111-111111111111", nombre: "Navajas", vistas: 7 },
    ]);

    const metodos = falso.consultas.find((c) => c.tabla === "estadisticas_dia")!.metodos;
    expect(metodos).toContainEqual({ metodo: "eq", args: ["local_id", LOCAL_ID] });
    expect(metodos).toContainEqual({ metodo: "gte", args: ["dia", "2026-10-17"] });
    expect(metodos).toContainEqual({ metodo: "lte", args: ["dia", "2026-10-23"] });
    expect(falso.rpcs).toEqual([
      { funcion: "platos_mas_vistos", args: { p_local: LOCAL_ID, p_desde: "2026-10-17", p_hasta: "2026-10-23", p_limite: 10 } },
    ]);
  });

  it("90 días cruzando el cambio de hora y de año dan 90 elementos", async () => {
    vi.useFakeTimers({ now: new Date("2027-01-15T10:00:00Z"), toFake: ["Date"] });
    servidor.crearClienteServidor.mockResolvedValue(clienteFalso().cliente);
    const r = await obtenerResumenEstadisticas(LOCAL_ID, 90);
    expect(r.dias).toHaveLength(90);
    expect(r.desde).toBe("2026-10-18");
    expect(r.hasta).toBe("2027-01-15");
    expect(new Set(r.dias.map((d) => d.dia)).size).toBe(90);
    expect(r.totalVisitas).toBe(0);
    expect(r.platosMasVistos).toEqual([]);
  });

  it("lanza si falla la base de datos", async () => {
    servidor.crearClienteServidor.mockResolvedValue(
      clienteFalso({ tablas: { estadisticas_dia: { error: { code: "500", message: "caído" } } } }).cliente,
    );
    await expect(obtenerResumenEstadisticas(LOCAL_ID, 30)).rejects.toThrow();
  });

  it("id que no es uuid: resumen vacío sin consultar", async () => {
    const falso = clienteFalso();
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    const r = await obtenerResumenEstadisticas("x", 7);
    expect(r.dias).toHaveLength(7);
    expect(falso.consultas).toHaveLength(0);
  });
});
