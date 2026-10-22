import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearSupabaseFalso, type RespuestaFalsa } from "./pruebas/supabase-falso";
import { LOCAL_ID, MENU_ID, PLATO_ID, SECCION_ID, USUARIO_ID } from "./pruebas/filas-ejemplo";

vi.mock("server-only", () => ({}));
const servidor = vi.hoisted(() => ({ crearClienteServidor: vi.fn(), crearClientePublico: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => servidor);
const cache = vi.hoisted(() => ({
  trasGuardarCarta: vi.fn(async () => {}),
  revalidarCartaFueraDeAccion: vi.fn(async () => {}),
  etiquetaCarta: (s: string) => `carta:${s}`,
  etiquetaLocal: (s: string) => `local:${s}`,
  ETIQUETA_LISTA_CARTAS: "cartas",
}));
vi.mock("./cache", () => cache);

import {
  actualizarLocal,
  borrarMenu,
  borrarPlato,
  borrarSeccion,
  cambiarAgotado,
  crearLocal,
  guardarHorarios,
  guardarLogo,
  guardarMenu,
  guardarPlato,
  guardarSeccion,
  publicarLocal,
  reordenar,
} from "./mutaciones";

type Opciones = Parameters<typeof crearSupabaseFalso>[0];

function usar(opciones: Opciones = {}) {
  const falso = crearSupabaseFalso(opciones);
  servidor.crearClienteServidor.mockResolvedValue(falso.cliente);
  return falso;
}

const errorPg = (code: string, message = "error"): RespuestaFalsa => ({ data: null, error: { code, message } });

const LOGO_NUEVO = `${LOCAL_ID}/logo/aaaa1111aaaa1111.png`;
const LOGO_VIEJO = `${LOCAL_ID}/logo/bbbb2222bbbb2222.png`;
const FOTO_NUEVA = `${LOCAL_ID}/platos/${PLATO_ID}/cccc3333cccc3333.webp`;
const FOTO_VIEJA = `${LOCAL_ID}/platos/${PLATO_ID}/dddd4444dddd4444.webp`;

const entradaLocal = {
  localId: LOCAL_ID,
  nombre: "Bar Pepe",
  slug: "bar-pepe",
  descripcion: null,
  direccion: null,
  telefono: null,
  colorMarca: "#b9461a",
  permitirIndexar: true,
};

const entradaPlato = {
  localId: LOCAL_ID,
  platoId: PLATO_ID,
  esNuevo: true,
  seccionId: SECCION_ID,
  nombre: "Pulpo a la gallega",
  descripcion: null,
  precios: [
    { formato: "racion_mediana" as const, texto: null, centimos: 1000 },
    { id: "pg01", formato: "racion_grande" as const, texto: null, centimos: 1200 },
  ],
  alergenos: ["moluscos" as const],
  trazas: [],
  alergenosConfirmados: true,
  etiquetas: [],
  fotoRuta: FOTO_NUEVA,
  visible: true,
};

const entradaMenu = {
  localId: LOCAL_ID,
  nombre: "Menú del día",
  precioCentimos: 1200,
  dias: [1, 2, 3, 4, 5] as Array<1 | 2 | 3 | 4 | 5>,
  horaInicio: "13:00",
  horaFin: "16:00",
  grupos: [{ titulo: "Primeros", items: [{ nombre: "Lentejas", alergenos: [], alergenosConfirmados: true }] }, { id: "gr01", titulo: "Postres", items: [] }],
  notas: null,
  visible: true,
};

/** Datos (insert/update) que se mandaron a una tabla. */
function enviado(falso: ReturnType<typeof crearSupabaseFalso>, tabla: string, metodo: "insert" | "update") {
  const llamada = falso.metodosDe(tabla).find((m) => m.some((x) => x.metodo === metodo));
  return llamada?.find((x) => x.metodo === metodo)?.args[0] as Record<string, unknown> | undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Casos comunes a todas las mutaciones: datos inválidos y sin sesión
// ---------------------------------------------------------------------------

const casos: Array<{ nombre: string; llamar: () => Promise<unknown>; invalida: () => Promise<unknown> }> = [
  { nombre: "crearLocal", llamar: () => crearLocal({ nombre: "Bar", slug: "bar-pepe" }), invalida: () => crearLocal({ nombre: "", slug: "Bar" }) },
  { nombre: "actualizarLocal", llamar: () => actualizarLocal(entradaLocal), invalida: () => actualizarLocal({ ...entradaLocal, colorMarca: "#ffff00" }) },
  { nombre: "guardarHorarios", llamar: () => guardarHorarios({ localId: LOCAL_ID, horarios: [] }), invalida: () => guardarHorarios({ localId: "x", horarios: [] }) },
  { nombre: "guardarLogo", llamar: () => guardarLogo({ localId: LOCAL_ID, logoRuta: LOGO_NUEVO }), invalida: () => guardarLogo({ localId: LOCAL_ID, logoRuta: "otro/logo/a.png" }) },
  { nombre: "publicarLocal", llamar: () => publicarLocal({ localId: LOCAL_ID, publicado: true }), invalida: () => publicarLocal({ localId: "x", publicado: true }) },
  {
    nombre: "guardarSeccion",
    llamar: () => guardarSeccion({ localId: LOCAL_ID, nombre: "Tapas", descripcion: null, visible: true }),
    invalida: () => guardarSeccion({ localId: LOCAL_ID, nombre: "", descripcion: null, visible: true }),
  },
  { nombre: "borrarSeccion", llamar: () => borrarSeccion(LOCAL_ID, SECCION_ID), invalida: () => borrarSeccion(LOCAL_ID, "x") },
  { nombre: "guardarPlato", llamar: () => guardarPlato(entradaPlato), invalida: () => guardarPlato({ ...entradaPlato, precios: [] }) },
  { nombre: "borrarPlato", llamar: () => borrarPlato(LOCAL_ID, PLATO_ID), invalida: () => borrarPlato("x", PLATO_ID) },
  {
    nombre: "cambiarAgotado",
    llamar: () => cambiarAgotado({ localId: LOCAL_ID, platoId: PLATO_ID, agotado: true }),
    invalida: () => cambiarAgotado({ localId: LOCAL_ID, platoId: "x", agotado: true }),
  },
  {
    nombre: "reordenar",
    llamar: () => reordenar({ localId: LOCAL_ID, tabla: "platos", ids: [PLATO_ID] }),
    invalida: () => reordenar({ localId: LOCAL_ID, tabla: "platos", ids: [] }),
  },
  { nombre: "guardarMenu", llamar: () => guardarMenu(entradaMenu), invalida: () => guardarMenu({ ...entradaMenu, dias: [] }) },
  { nombre: "borrarMenu", llamar: () => borrarMenu(LOCAL_ID, MENU_ID), invalida: () => borrarMenu(LOCAL_ID, "x") },
];

describe.each(casos)("$nombre", ({ llamar, invalida }) => {
  it("datos inválidos: datos_invalidos con campos y sin tocar la base de datos", async () => {
    const falso = usar();
    const r = (await invalida()) as { ok: boolean; error?: string; campos?: Record<string, string> };
    expect(r.ok).toBe(false);
    expect(r.error).toBe("datos_invalidos");
    expect(Object.keys(r.campos ?? {}).length).toBeGreaterThan(0);
    expect(falso.llamadas).toHaveLength(0);
    expect(falso.rpcs).toHaveLength(0);
  });

  it("sin sesión: no_autenticado", async () => {
    const falso = usar({ claims: null });
    expect(await llamar()).toEqual({ ok: false, error: "no_autenticado" });
    expect(falso.llamadas).toHaveLength(0);
    expect(cache.trasGuardarCarta).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Local
// ---------------------------------------------------------------------------

describe("crearLocal", () => {
  it("crea el local a nombre del usuario", async () => {
    const falso = usar({ tablas: { locales: { data: { id: LOCAL_ID } } } });
    expect(await crearLocal({ nombre: " Bar Pepe ", slug: "bar-pepe" })).toEqual({ ok: true, datos: { localId: LOCAL_ID } });
    expect(enviado(falso, "locales", "insert")).toEqual({ dueno_id: USUARIO_ID, nombre: "Bar Pepe", slug: "bar-pepe" });
  });

  it("slug ocupado (23505), límite (KL001) y slug reservado", async () => {
    usar({ tablas: { locales: errorPg("23505", 'duplicate key value violates unique constraint "locales_slug_key"') } });
    expect(await crearLocal({ nombre: "Bar", slug: "bar-pepe" })).toMatchObject({ ok: false, error: "slug_ocupado", campos: { slug: "ocupado" } });
    usar({ tablas: { locales: errorPg("KL001", "limite_alcanzado") } });
    expect(await crearLocal({ nombre: "Bar", slug: "bar-pepe" })).toMatchObject({ ok: false, error: "limite_alcanzado" });
    usar();
    expect(await crearLocal({ nombre: "Bar", slug: "admin" })).toMatchObject({ ok: false, error: "slug_reservado", campos: { slug: "reservado" } });
  });
});

describe("actualizarLocal", () => {
  it("guarda y, si cambia el slug, invalida también el anterior y la lista de cartas", async () => {
    const falso = usar({
      tablas: { locales: [{ data: { slug: "bar-viejo", permitir_indexar: true } }, { data: [{ id: LOCAL_ID }] }] },
    });
    expect(await actualizarLocal(entradaLocal)).toEqual({ ok: true, datos: undefined });
    expect(enviado(falso, "locales", "update")).toEqual({
      nombre: "Bar Pepe",
      slug: "bar-pepe",
      descripcion: null,
      direccion: null,
      telefono: null,
      color_marca: "#b9461a",
      permitir_indexar: true,
    });
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID, { slugAnterior: "bar-viejo", listaCartas: true });
  });

  it("sin cambios de slug ni de indexado no toca la lista", async () => {
    usar({ tablas: { locales: [{ data: { slug: "bar-pepe", permitir_indexar: true } }, { data: [{ id: LOCAL_ID }] }] } });
    await actualizarLocal(entradaLocal);
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID, { slugAnterior: undefined, listaCartas: false });
  });

  it("local ajeno o inexistente: no_encontrado; slug ocupado traducido", async () => {
    usar({ tablas: { locales: { data: null } } });
    expect(await actualizarLocal(entradaLocal)).toMatchObject({ ok: false, error: "no_encontrado" });
    usar({ tablas: { locales: [{ data: { slug: "bar-viejo", permitir_indexar: true } }, errorPg("23505", "slug_ocupado")] } });
    expect(await actualizarLocal(entradaLocal)).toMatchObject({ ok: false, error: "slug_ocupado" });
    expect(cache.trasGuardarCarta).not.toHaveBeenCalled();
  });
});

describe("guardarHorarios", () => {
  it("guarda e invalida la carta", async () => {
    const falso = usar({ tablas: { locales: { data: [{ id: LOCAL_ID }] } } });
    const horarios = [{ dia: 1 as const, abre: "13:00", cierra: "16:00" }];
    expect(await guardarHorarios({ localId: LOCAL_ID, horarios })).toEqual({ ok: true, datos: undefined });
    expect(enviado(falso, "locales", "update")).toEqual({ horarios });
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("0 filas: no_encontrado; CHECK: datos_invalidos", async () => {
    usar({ tablas: { locales: { data: [] } } });
    expect(await guardarHorarios({ localId: LOCAL_ID, horarios: [] })).toMatchObject({ error: "no_encontrado" });
    usar({ tablas: { locales: errorPg("23514") } });
    expect(await guardarHorarios({ localId: LOCAL_ID, horarios: [] })).toMatchObject({ error: "datos_invalidos" });
  });
});

describe("guardarLogo", () => {
  it("guarda la ruta nueva y borra el logo anterior del bucket", async () => {
    const falso = usar({ tablas: { locales: [{ data: { logo_ruta: LOGO_VIEJO } }, { data: [{ id: LOCAL_ID }] }] } });
    expect(await guardarLogo({ localId: LOCAL_ID, logoRuta: LOGO_NUEVO })).toEqual({ ok: true, datos: undefined });
    expect(enviado(falso, "locales", "update")).toEqual({ logo_ruta: LOGO_NUEVO });
    expect(falso.borrados).toEqual([{ bucket: "imagenes", rutas: [LOGO_VIEJO] }]);
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("si no había logo no borra nada; si falla el guardado no borra", async () => {
    const sinLogo = usar({ tablas: { locales: [{ data: { logo_ruta: null } }, { data: [{ id: LOCAL_ID }] }] } });
    await guardarLogo({ localId: LOCAL_ID, logoRuta: LOGO_NUEVO });
    expect(sinLogo.borrados).toEqual([]);
    const falla = usar({ tablas: { locales: [{ data: { logo_ruta: LOGO_VIEJO } }, errorPg("42501")] } });
    expect(await guardarLogo({ localId: LOCAL_ID, logoRuta: null })).toMatchObject({ error: "sin_permiso" });
    expect(falla.borrados).toEqual([]);
  });
});

describe("publicarLocal", () => {
  it("publica e invalida también la lista de cartas", async () => {
    const falso = usar({ tablas: { locales: { data: [{ id: LOCAL_ID }] } } });
    expect(await publicarLocal({ localId: LOCAL_ID, publicado: true })).toEqual({ ok: true, datos: undefined });
    expect(enviado(falso, "locales", "update")).toEqual({ publicado: true });
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID, { listaCartas: true });
  });

  it("error de permisos traducido", async () => {
    usar({ tablas: { locales: errorPg("42501") } });
    expect(await publicarLocal({ localId: LOCAL_ID, publicado: true })).toMatchObject({ ok: false, error: "sin_permiso" });
  });
});

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

describe("guardarSeccion", () => {
  it("crea al final de la lista", async () => {
    const falso = usar({ tablas: { secciones: [{ data: [{ orden: 4 }] }, { data: { id: SECCION_ID } }] } });
    expect(await guardarSeccion({ localId: LOCAL_ID, nombre: "Tapas", descripcion: "", visible: true })).toEqual({
      ok: true,
      datos: { seccionId: SECCION_ID },
    });
    expect(enviado(falso, "secciones", "insert")).toEqual({ local_id: LOCAL_ID, nombre: "Tapas", descripcion: null, visible: true, orden: 5 });
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("edita si llega seccionId", async () => {
    const falso = usar({ tablas: { secciones: { data: [{ id: SECCION_ID }] } } });
    expect(await guardarSeccion({ localId: LOCAL_ID, seccionId: SECCION_ID, nombre: "Tapas", descripcion: null, visible: false })).toEqual({
      ok: true,
      datos: { seccionId: SECCION_ID },
    });
    expect(enviado(falso, "secciones", "update")).toEqual({ nombre: "Tapas", descripcion: null, visible: false });
  });

  it("límite de secciones y local ajeno traducidos", async () => {
    usar({ tablas: { secciones: [{ data: [] }, errorPg("KL001")] } });
    expect(await guardarSeccion({ localId: LOCAL_ID, nombre: "Tapas", descripcion: null, visible: true })).toMatchObject({ error: "limite_alcanzado" });
    usar({ tablas: { secciones: [{ data: [] }, errorPg("42501")] } });
    expect(await guardarSeccion({ localId: LOCAL_ID, nombre: "Tapas", descripcion: null, visible: true })).toMatchObject({ error: "sin_permiso" });
  });
});

describe("borrarSeccion", () => {
  it("borra la sección y las fotos de sus platos", async () => {
    const falso = usar({
      tablas: {
        platos: { data: [{ foto_ruta: FOTO_VIEJA }, { foto_ruta: null }] },
        secciones: { data: [{ id: SECCION_ID }] },
      },
    });
    expect(await borrarSeccion(LOCAL_ID, SECCION_ID)).toEqual({ ok: true, datos: undefined });
    expect(falso.metodosDe("secciones")[0].map((m) => m.metodo)).toContain("delete");
    expect(falso.borrados).toEqual([{ bucket: "imagenes", rutas: [FOTO_VIEJA] }]);
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("si no borra nada (ajena o inexistente) no toca el bucket", async () => {
    const falso = usar({ tablas: { platos: { data: [{ foto_ruta: FOTO_VIEJA }] }, secciones: { data: [] } } });
    expect(await borrarSeccion(LOCAL_ID, SECCION_ID)).toMatchObject({ ok: false, error: "no_encontrado" });
    expect(falso.borrados).toEqual([]);
    usar({ tablas: { platos: { data: [] }, secciones: errorPg("42501") } });
    expect(await borrarSeccion(LOCAL_ID, SECCION_ID)).toMatchObject({ error: "sin_permiso" });
  });
});

// ---------------------------------------------------------------------------
// Platos
// ---------------------------------------------------------------------------

describe("guardarPlato", () => {
  it("nuevo: inserta con el id recibido, asigna ids a las variantes nuevas y conserva las existentes", async () => {
    const falso = usar({ tablas: { platos: [{ data: [{ orden: 2 }] }, { data: { id: PLATO_ID } }] } });
    expect(await guardarPlato(entradaPlato)).toEqual({ ok: true, datos: { platoId: PLATO_ID } });
    const fila = enviado(falso, "platos", "insert")!;
    expect(fila).toMatchObject({
      id: PLATO_ID,
      local_id: LOCAL_ID,
      seccion_id: SECCION_ID,
      nombre: "Pulpo a la gallega",
      alergenos: ["moluscos"],
      alergenos_confirmados: true,
      foto_ruta: FOTO_NUEVA,
      visible: true,
      orden: 3,
    });
    const precios = fila.precios as Array<{ id: string; formato: string }>;
    expect(precios[0].id).toMatch(/^[a-z0-9]{8}$/);
    expect(precios[1].id).toBe("pg01");
    expect(precios.map((p) => p.formato)).toEqual(["racion_mediana", "racion_grande"]);
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("nuevo sin id: lo genera el servidor", async () => {
    const falso = usar({ tablas: { platos: [{ data: [] }, { data: { id: "x" } }] } });
    const { platoId: _id, ...sinId } = entradaPlato;
    void _id;
    const r = await guardarPlato({ ...sinId, fotoRuta: null });
    expect(r.ok).toBe(true);
    expect(String(enviado(falso, "platos", "insert")!.id)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("nuevo con un id que ya existe: conflicto; sección de otro local: no_encontrado", async () => {
    usar({ tablas: { platos: [{ data: [] }, errorPg("23505", 'duplicate key value violates unique constraint "platos_pkey"')] } });
    expect(await guardarPlato(entradaPlato)).toMatchObject({ ok: false, error: "conflicto" });
    usar({ tablas: { platos: [{ data: [] }, errorPg("23503")] } });
    expect(await guardarPlato(entradaPlato)).toMatchObject({ ok: false, error: "no_encontrado" });
  });

  it("editar: actualiza y borra la foto anterior si cambió", async () => {
    const falso = usar({ tablas: { platos: [{ data: { foto_ruta: FOTO_VIEJA } }, { data: [{ id: PLATO_ID }] }] } });
    expect(await guardarPlato({ ...entradaPlato, esNuevo: false })).toEqual({ ok: true, datos: { platoId: PLATO_ID } });
    const fila = enviado(falso, "platos", "update")!;
    expect(fila).not.toHaveProperty("id");
    expect(fila).not.toHaveProperty("local_id");
    expect(fila.foto_ruta).toBe(FOTO_NUEVA);
    expect(falso.borrados).toEqual([{ bucket: "imagenes", rutas: [FOTO_VIEJA] }]);
  });

  it("editar sin platoId: datos_invalidos; plato ajeno: no_encontrado y no borra fotos", async () => {
    usar();
    const { platoId: _id, ...sinId } = entradaPlato;
    void _id;
    expect(await guardarPlato({ ...sinId, esNuevo: false, fotoRuta: null })).toMatchObject({ error: "datos_invalidos", campos: { platoId: "requerido" } });
    const falso = usar({ tablas: { platos: [{ data: { foto_ruta: FOTO_VIEJA } }, { data: [] }] } });
    expect(await guardarPlato({ ...entradaPlato, esNuevo: false })).toMatchObject({ error: "no_encontrado" });
    expect(falso.borrados).toEqual([]);
  });
});

describe("borrarPlato", () => {
  it("borra el plato y su foto", async () => {
    const falso = usar({ tablas: { platos: { data: [{ id: PLATO_ID, foto_ruta: FOTO_VIEJA }] } } });
    expect(await borrarPlato(LOCAL_ID, PLATO_ID)).toEqual({ ok: true, datos: undefined });
    expect(falso.borrados).toEqual([{ bucket: "imagenes", rutas: [FOTO_VIEJA] }]);
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("no encontrado y error traducido", async () => {
    usar({ tablas: { platos: { data: [] } } });
    expect(await borrarPlato(LOCAL_ID, PLATO_ID)).toMatchObject({ error: "no_encontrado" });
    usar({ tablas: { platos: errorPg("42501") } });
    expect(await borrarPlato(LOCAL_ID, PLATO_ID)).toMatchObject({ error: "sin_permiso" });
  });
});

describe("cambiarAgotado", () => {
  it("marca agotado e invalida la carta", async () => {
    const falso = usar({ tablas: { platos: { data: [{ id: PLATO_ID }] } } });
    expect(await cambiarAgotado({ localId: LOCAL_ID, platoId: PLATO_ID, agotado: true })).toEqual({ ok: true, datos: undefined });
    expect(enviado(falso, "platos", "update")).toEqual({ agotado: true });
    expect(falso.metodosDe("platos")[0]).toEqual(
      expect.arrayContaining([
        { metodo: "eq", args: ["id", PLATO_ID] },
        { metodo: "eq", args: ["local_id", LOCAL_ID] },
      ]),
    );
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("no encontrado y error del servidor", async () => {
    usar({ tablas: { platos: { data: [] } } });
    expect(await cambiarAgotado({ localId: LOCAL_ID, platoId: PLATO_ID, agotado: true })).toMatchObject({ error: "no_encontrado" });
    usar({ tablas: { platos: errorPg("XX000") } });
    expect(await cambiarAgotado({ localId: LOCAL_ID, platoId: PLATO_ID, agotado: true })).toMatchObject({ error: "error_servidor" });
  });
});

describe("reordenar", () => {
  it("llama a la función SQL con la tabla y los ids", async () => {
    const falso = usar({ rpc: { reordenar: { data: 2 } } });
    const ids = [PLATO_ID, "b2222222-2222-4222-8222-222222222222"];
    expect(await reordenar({ localId: LOCAL_ID, tabla: "platos", ids })).toEqual({ ok: true, datos: undefined });
    expect(falso.rpcs).toEqual([{ funcion: "reordenar", args: { p_tabla: "platos", p_ids: ids } }]);
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("ids ajenos: sin_permiso", async () => {
    usar({ rpc: { reordenar: errorPg("42501", "sin_permiso") } });
    expect(await reordenar({ localId: LOCAL_ID, tabla: "platos", ids: [PLATO_ID] })).toMatchObject({ error: "sin_permiso" });
  });
});

// ---------------------------------------------------------------------------
// Menús
// ---------------------------------------------------------------------------

describe("guardarMenu", () => {
  it("nuevo: asigna ids a grupos e ítems nuevos y guarda el contenido en snake_case", async () => {
    const falso = usar({ tablas: { menus: [{ data: [{ orden: 0 }] }, { data: { id: MENU_ID } }] } });
    expect(await guardarMenu(entradaMenu)).toEqual({ ok: true, datos: { menuId: MENU_ID } });
    const fila = enviado(falso, "menus", "insert")!;
    expect(fila).toMatchObject({ local_id: LOCAL_ID, nombre: "Menú del día", precio_centimos: 1200, dias: [1, 2, 3, 4, 5], hora_inicio: "13:00", hora_fin: "16:00", orden: 1 });
    const contenido = fila.contenido as { grupos: Array<{ id: string; items: Array<{ id: string; alergenos_confirmados: boolean }> }> };
    expect(contenido.grupos[0].id).toMatch(/^[a-z0-9]{8}$/);
    expect(contenido.grupos[0].items[0].id).toMatch(/^[a-z0-9]{8}$/);
    expect(contenido.grupos[0].items[0].alergenos_confirmados).toBe(true);
    expect(contenido.grupos[1].id).toBe("gr01");
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("editar", async () => {
    const falso = usar({ tablas: { menus: { data: [{ id: MENU_ID }] } } });
    expect(await guardarMenu({ ...entradaMenu, menuId: MENU_ID })).toEqual({ ok: true, datos: { menuId: MENU_ID } });
    expect(enviado(falso, "menus", "update")).not.toHaveProperty("local_id");
  });

  it("límite de menús y menú ajeno", async () => {
    usar({ tablas: { menus: [{ data: [] }, errorPg("KL001")] } });
    expect(await guardarMenu(entradaMenu)).toMatchObject({ error: "limite_alcanzado" });
    usar({ tablas: { menus: { data: [] } } });
    expect(await guardarMenu({ ...entradaMenu, menuId: MENU_ID })).toMatchObject({ error: "no_encontrado" });
  });
});

describe("borrarMenu", () => {
  it("borra e invalida", async () => {
    usar({ tablas: { menus: { data: [{ id: MENU_ID }] } } });
    expect(await borrarMenu(LOCAL_ID, MENU_ID)).toEqual({ ok: true, datos: undefined });
    expect(cache.trasGuardarCarta).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("no encontrado y error traducido", async () => {
    usar({ tablas: { menus: { data: [] } } });
    expect(await borrarMenu(LOCAL_ID, MENU_ID)).toMatchObject({ error: "no_encontrado" });
    usar({ tablas: { menus: errorPg("42501") } });
    expect(await borrarMenu(LOCAL_ID, MENU_ID)).toMatchObject({ error: "sin_permiso" });
  });
});

describe("errores inesperados", () => {
  it("nunca lanza: error_servidor", async () => {
    servidor.crearClienteServidor.mockRejectedValue(new Error("sin red"));
    expect(await publicarLocal({ localId: LOCAL_ID, publicado: true })).toEqual({ ok: false, error: "error_servidor" });
  });
});
