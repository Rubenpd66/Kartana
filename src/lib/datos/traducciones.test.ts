import { beforeEach, describe, expect, it, vi } from "vitest";
import { calcularHuella } from "@/lib/dominio/huella";
import type { TraduccionAGuardar } from "@/lib/tipos/traduccion";
import { crearSupabaseFalso } from "./pruebas/supabase-falso";
import { filaLocal, filaMenu, filaPlato, filaSeccion, LOCAL_ID, MENU_ID, PLATO_ID, SECCION_ID, USUARIO_ID } from "./pruebas/filas-ejemplo";

vi.mock("server-only", () => ({}));
const servidor = vi.hoisted(() => ({ crearClienteServidor: vi.fn(), crearClientePublico: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => servidor);
const cache = vi.hoisted(() => ({ trasGuardarCarta: vi.fn(), revalidarCartaFueraDeAccion: vi.fn() }));
vi.mock("./cache", () => cache);

import {
  actualizarIdiomasActivos,
  consumirCuotaTraduccion,
  descartarTraduccionManual,
  guardarTraduccionesAuto,
  guardarTraduccionManual,
  listarTextosTraducibles,
} from "./traducciones";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const HUELLA = "0123456789abcdef";
const auto = (texto: string, huella = HUELLA) => ({ texto, origen: "auto", huella, fecha: "2026-11-02T10:00:00Z" });
const manual = (texto: string, huella = HUELLA) => ({ texto, origen: "manual", huella, fecha: "2026-11-02T10:00:00Z" });

function filaTraducible() {
  return {
    id: LOCAL_ID,
    descripcion: "Mariscos y tapas",
    traducciones: { en: { descripcion: auto("Seafood and tapas") } },
    secciones: [
      {
        ...filaSeccion({ id: "a2222222-1111-4111-8111-111111111111", nombre: "Postres", orden: 1, descripcion: "   " }),
        platos: [],
      },
      {
        ...filaSeccion({ traducciones: { fr: { nombre: manual("Fruits de mer") } } }),
        platos: [
          filaPlato({
            precios: [
              { id: "rc01", formato: "racion", texto: null, centimos: 1400 },
              { id: "ot01", formato: "otro", texto: "Con orujo", centimos: 250 },
            ],
            traducciones: {
              en: { nombre: manual("Galician octopus"), "precio.ot01.texto": auto("With orujo") },
              // basura: idioma base, campo con forma rara y traducción mal formada
              es: { nombre: auto("Pulpo") },
              de: { nombre: { texto: 3 } },
            },
          }),
        ],
      },
    ],
    menus: [filaMenu()],
  };
}

describe("listarTextosTraducibles", () => {
  it("reúne todos los campos traducibles con su huella y sus traducciones", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: filaTraducible() } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);

    const textos = await listarTextosTraducibles(LOCAL_ID);

    expect(textos.map((t) => `${t.tabla}:${t.filaId === LOCAL_ID ? "L" : t.filaId.slice(0, 2)}:${t.campo}`)).toEqual([
      "locales:L:descripcion",
      "secciones:a1:nombre",
      "platos:b1:nombre",
      "platos:b1:descripcion",
      "platos:b1:precio.ot01.texto",
      "secciones:a2:nombre",
      "menus:c1:nombre",
      "menus:c1:notas",
      "menus:c1:grupo.gr01.titulo",
      "menus:c1:item.it01.nombre",
    ]);
    const nombrePlato = textos.find((t) => t.tabla === "platos" && t.campo === "nombre")!;
    expect(nombrePlato).toMatchObject({ filaId: PLATO_ID, original: "Pulpo a la gallega", huellaActual: await calcularHuella("Pulpo a la gallega") });
    expect(nombrePlato.traducciones).toEqual({ en: manual("Galician octopus") });
    expect(textos.find((t) => t.campo === "precio.ot01.texto")!).toMatchObject({ original: "Con orujo", traducciones: { en: auto("With orujo") } });
    expect(textos[0].traducciones).toEqual({ en: auto("Seafood and tapas") });
    expect(textos.find((t) => t.campo === "item.it01.nombre")!).toMatchObject({ filaId: MENU_ID, original: "Lentejas" });
    expect(textos.find((t) => t.filaId === SECCION_ID && t.campo === "nombre")!.traducciones).toEqual({ fr: manual("Fruits de mer") });
  });

  it("filtra por el dueño y no devuelve nada sin sesión o si el local no es suyo", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: null } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await listarTextosTraducibles(LOCAL_ID)).toEqual([]);
    expect(falso.metodosDe("locales")[0]).toContainEqual({ metodo: "eq", args: ["dueno_id", USUARIO_ID] });

    servidor.crearClienteServidor.mockResolvedValue(crearSupabaseFalso({ claims: null }).cliente);
    expect(await listarTextosTraducibles(LOCAL_ID)).toEqual([]);
    expect(await listarTextosTraducibles("no-es-uuid")).toEqual([]);
  });
});

describe("guardarTraduccionesAuto", () => {
  const lote = (n: number, cambios: Partial<TraduccionAGuardar> = {}): TraduccionAGuardar[] =>
    Array.from({ length: n }, () => ({
      tabla: "platos",
      filaId: PLATO_ID,
      idioma: "en",
      campo: "nombre",
      texto: "Octopus",
      huella: HUELLA,
      origen: "auto",
      ...cambios,
    }));

  it("agrupa por tabla (en el orden locales, secciones, platos, menús), llama a la función SQL y suma lo guardado", async () => {
    const falso = crearSupabaseFalso({ rpc: { guardar_traducciones_auto: [{ data: 1 }, { data: 0 }] } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);

    const r = await guardarTraduccionesAuto(LOCAL_ID, [
      ...lote(1),
      ...lote(1, { tabla: "secciones", filaId: SECCION_ID, campo: "nombre", idioma: "fr", texto: "Fruits de mer" }),
    ]);

    expect(r).toEqual({ ok: true, datos: { guardadas: 1 } });
    expect(falso.rpcs).toEqual([
      {
        funcion: "guardar_traducciones_auto",
        args: {
          p_tabla: "secciones",
          p_lote: [{ fila_id: SECCION_ID, idioma: "fr", campo: "nombre", texto: "Fruits de mer", huella: HUELLA }],
        },
      },
      {
        funcion: "guardar_traducciones_auto",
        args: { p_tabla: "platos", p_lote: [{ fila_id: PLATO_ID, idioma: "en", campo: "nombre", texto: "Octopus", huella: HUELLA }] },
      },
    ]);
    expect(cache.revalidarCartaFueraDeAccion).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("no envía nunca origen «manual»: el lote va sin origen y la función fuerza «auto»", async () => {
    const falso = crearSupabaseFalso({ rpc: { guardar_traducciones_auto: { data: 0 } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    await guardarTraduccionesAuto(LOCAL_ID, lote(1, { origen: "manual" }));
    expect(JSON.stringify(falso.rpcs)).not.toContain("manual");
  });

  it("parte los lotes grandes en trozos de 500 y no invalida la caché si no guarda nada", async () => {
    const falso = crearSupabaseFalso({ rpc: { guardar_traducciones_auto: { data: 0 } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    const r = await guardarTraduccionesAuto(LOCAL_ID, lote(501));
    expect(r).toEqual({ ok: true, datos: { guardadas: 0 } });
    expect(falso.rpcs.map((x) => (x.args as { p_lote: unknown[] }).p_lote.length)).toEqual([500, 1]);
    expect(cache.revalidarCartaFueraDeAccion).not.toHaveBeenCalled();
  });

  it("lote vacío: no llama a nada", async () => {
    const falso = crearSupabaseFalso();
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await guardarTraduccionesAuto(LOCAL_ID, [])).toEqual({ ok: true, datos: { guardadas: 0 } });
    expect(falso.rpcs).toHaveLength(0);
  });

  it("rechaza lotes inválidos sin llamar a la base de datos", async () => {
    const falso = crearSupabaseFalso();
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    for (const malo of [lote(1, { idioma: "es" as never }), lote(1, { campo: "dueno_id" }), lote(1, { huella: "XYZ" }), lote(1, { texto: " " })]) {
      expect(await guardarTraduccionesAuto(LOCAL_ID, malo)).toMatchObject({ ok: false, error: "datos_invalidos" });
    }
    expect(await guardarTraduccionesAuto("x", lote(1))).toMatchObject({ ok: false, error: "datos_invalidos" });
    expect(falso.rpcs).toHaveLength(0);
  });

  it("sin sesión -> no_autenticado; error de la base de datos -> código", async () => {
    servidor.crearClienteServidor.mockResolvedValue(crearSupabaseFalso({ claims: null }).cliente);
    expect(await guardarTraduccionesAuto(LOCAL_ID, lote(1))).toEqual({ ok: false, error: "no_autenticado" });

    const falso = crearSupabaseFalso({ rpc: { guardar_traducciones_auto: { data: null, error: { code: "22023", message: "lote_no_valido" } } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await guardarTraduccionesAuto(LOCAL_ID, lote(1))).toEqual({ ok: false, error: "datos_invalidos" });
  });
});

describe("guardarTraduccionManual", () => {
  const entrada = { localId: LOCAL_ID, tabla: "platos" as const, filaId: PLATO_ID, campo: "nombre", idioma: "en" as const, texto: " Octopus " };

  it("calcula la huella del original actual, llama a la función e invalida la caché", async () => {
    const falso = crearSupabaseFalso({ tablas: { platos: { data: filaPlato() } }, rpc: { guardar_traduccion_manual: { data: true } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);

    expect(await guardarTraduccionManual(entrada)).toEqual({ ok: true, datos: undefined });
    expect(falso.rpcs).toEqual([
      {
        funcion: "guardar_traduccion_manual",
        args: {
          p_tabla: "platos",
          p_fila: PLATO_ID,
          p_idioma: "en",
          p_campo: "nombre",
          p_texto: "Octopus",
          p_huella: await calcularHuella("Pulpo a la gallega"),
        },
      },
    ]);
    expect(falso.metodosDe("platos")[0]).toContainEqual({ metodo: "eq", args: ["local_id", LOCAL_ID] });
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("una variante de precio que no existe o no es «otro» -> no_encontrado", async () => {
    const falso = crearSupabaseFalso({ tablas: { platos: { data: filaPlato() } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await guardarTraduccionManual({ ...entrada, campo: "precio.pm01.texto" })).toEqual({ ok: false, error: "no_encontrado" });
    expect(falso.rpcs).toHaveLength(0);
  });

  it("la función devuelve false (fila ajena) -> no_encontrado y no invalida", async () => {
    const falso = crearSupabaseFalso({ tablas: { platos: { data: filaPlato() } }, rpc: { guardar_traduccion_manual: { data: false } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await guardarTraduccionManual(entrada)).toEqual({ ok: false, error: "no_encontrado" });
    expect(cache.trasGuardarCarta).not.toHaveBeenCalled();
  });

  it("en «locales» la fila es el propio local", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: filaLocal() } }, rpc: { guardar_traduccion_manual: { data: true } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(
      await guardarTraduccionManual({ ...entrada, tabla: "locales", filaId: PLATO_ID, campo: "descripcion" }),
    ).toEqual({ ok: false, error: "no_encontrado" });
    expect(await guardarTraduccionManual({ ...entrada, tabla: "locales", filaId: LOCAL_ID, campo: "descripcion" })).toEqual({
      ok: true,
      datos: undefined,
    });
    expect((falso.rpcs[0].args as { p_huella: string }).p_huella).toBe(await calcularHuella("Mariscos y tapas"));
  });

  it("datos inválidos -> datos_invalidos con el campo", async () => {
    const falso = crearSupabaseFalso();
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await guardarTraduccionManual({ ...entrada, campo: "grupo.gr01.titulo" })).toEqual({
      ok: false,
      error: "datos_invalidos",
      campos: { campo: "formato" },
    });
    expect(falso.llamadas).toHaveLength(0);
  });
});

describe("descartarTraduccionManual", () => {
  it("llama a la función e invalida la caché", async () => {
    const falso = crearSupabaseFalso({ tablas: { menus: { data: filaMenu() } }, rpc: { descartar_traduccion_manual: { data: true } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    const r = await descartarTraduccionManual({ localId: LOCAL_ID, tabla: "menus", filaId: MENU_ID, campo: "item.it01.nombre", idioma: "gl" });
    expect(r).toEqual({ ok: true, datos: undefined });
    expect(falso.rpcs).toEqual([
      { funcion: "descartar_traduccion_manual", args: { p_tabla: "menus", p_fila: MENU_ID, p_idioma: "gl", p_campo: "item.it01.nombre" } },
    ]);
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("fila que no es de ese local -> no_encontrado", async () => {
    const falso = crearSupabaseFalso({ tablas: { menus: { data: null } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    const r = await descartarTraduccionManual({ localId: LOCAL_ID, tabla: "menus", filaId: MENU_ID, campo: "nombre", idioma: "gl" });
    expect(r).toEqual({ ok: false, error: "no_encontrado" });
    expect(falso.rpcs).toHaveLength(0);
  });
});

describe("actualizarIdiomasActivos", () => {
  it("guarda los idiomas (con «es») solo en un local propio e invalida carta y sitemap", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: [{ id: LOCAL_ID }] } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await actualizarIdiomasActivos({ localId: LOCAL_ID, idiomas: ["en", "ca"] })).toEqual({ ok: true, datos: undefined });
    const metodos = falso.metodosDe("locales")[0];
    expect(metodos).toContainEqual({ metodo: "update", args: [{ idiomas_activos: ["es", "en", "ca"] }] });
    expect(metodos).toContainEqual({ metodo: "eq", args: ["dueno_id", USUARIO_ID] });
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID, { listaCartas: true });
  });

  it("local ajeno -> no_encontrado; idioma desconocido -> datos_invalidos", async () => {
    servidor.crearClienteServidor.mockResolvedValue(crearSupabaseFalso({ tablas: { locales: { data: [] } } }).cliente);
    expect(await actualizarIdiomasActivos({ localId: LOCAL_ID, idiomas: ["en"] })).toEqual({ ok: false, error: "no_encontrado" });
    expect(await actualizarIdiomasActivos({ localId: LOCAL_ID, idiomas: ["it" as never] })).toMatchObject({ ok: false, error: "datos_invalidos" });
    expect(cache.trasGuardarCarta).not.toHaveBeenCalled();
  });
});

describe("consumirCuotaTraduccion", () => {
  it("devuelve lo que diga la función SQL", async () => {
    const falso = crearSupabaseFalso({ rpc: { consumir_cuota_traduccion: [{ data: true }, { data: false }] } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await consumirCuotaTraduccion(LOCAL_ID, 1200)).toBe(true);
    expect(await consumirCuotaTraduccion(LOCAL_ID, 60001)).toBe(false);
    expect(falso.rpcs[0]).toEqual({ funcion: "consumir_cuota_traduccion", args: { p_local: LOCAL_ID, p_caracteres: 1200 } });
  });

  it("false ante errores o cantidades absurdas (sin llamar); 0 caracteres no gasta nada", async () => {
    const falso = crearSupabaseFalso({ rpc: { consumir_cuota_traduccion: { data: null, error: { code: "500", message: "caído" } } } });
    servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
    expect(await consumirCuotaTraduccion(LOCAL_ID, 10)).toBe(false);
    const llamadas = falso.rpcs.length;
    expect(await consumirCuotaTraduccion(LOCAL_ID, -1)).toBe(false);
    expect(await consumirCuotaTraduccion(LOCAL_ID, 1.5)).toBe(false);
    expect(await consumirCuotaTraduccion("x", 10)).toBe(false);
    expect(await consumirCuotaTraduccion(LOCAL_ID, 0)).toBe(true);
    expect(falso.rpcs.length).toBe(llamadas);
  });
});
