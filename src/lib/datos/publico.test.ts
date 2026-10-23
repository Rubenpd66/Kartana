import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearSupabaseFalso } from "./pruebas/supabase-falso";
import { filaLocal, filaMenu, filaPlato, filaSeccion, LOCAL_ID } from "./pruebas/filas-ejemplo";

vi.mock("server-only", () => ({}));
const nextCache = vi.hoisted(() => ({ cacheTag: vi.fn(), cacheLife: vi.fn(), updateTag: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/cache", () => nextCache);
const servidor = vi.hoisted(() => ({ crearClienteServidor: vi.fn(), crearClientePublico: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => servidor);

import { buscarSlugActual, listarCartasIndexables, obtenerCartaPublica } from "./publico";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
});

function filaCompleta() {
  const { dueno_id: _d, creado_en: _c, ...local } = filaLocal();
  void _d;
  void _c;
  return {
    ...local,
    secciones: [
      {
        ...filaSeccion({ id: "s2", nombre: "Cazuelas", orden: 1 }),
        platos: [filaPlato({ id: "p3", seccion_id: "s2", nombre: "Cazuela de gambas", orden: 0 })],
      },
      {
        ...filaSeccion({ id: "s1", nombre: "Mariscos", orden: 0 }),
        platos: [
          filaPlato({ id: "p2", seccion_id: "s1", nombre: "Pulpo", orden: 2, foto_ruta: `${LOCAL_ID}/platos/p2/f.webp` }),
          filaPlato({ id: "p1", seccion_id: "s1", nombre: "Gamba roja", orden: 1, agotado: true }),
        ],
      },
      { ...filaSeccion({ id: "s3", nombre: "Vacía", orden: 2 }), platos: [] },
    ],
    menus: [filaMenu({ id: "m2", nombre: "Fin de semana", orden: 1 }), filaMenu({ id: "m1", orden: 0 })],
  };
}

describe("obtenerCartaPublica", () => {
  it("devuelve la carta ordenada, sin secciones vacías y con URLs absolutas", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: filaCompleta() } } });
    servidor.crearClientePublico.mockReturnValue(falso.cliente);

    const carta = await obtenerCartaPublica("la-guagua");

    expect(carta).not.toBeNull();
    expect(carta!.local.logoUrl).toBe(`https://abc.supabase.co/storage/v1/object/public/imagenes/${LOCAL_ID}/logo/abcd1234abcd1234.png`);
    expect(carta!.secciones.map((s) => s.nombre)).toEqual(["Mariscos", "Cazuelas"]);
    expect(carta!.secciones[0].platos.map((p) => p.nombre)).toEqual(["Gamba roja", "Pulpo"]);
    expect(carta!.secciones[0].platos[1].fotoUrl).toBe(
      `https://abc.supabase.co/storage/v1/object/public/imagenes/${LOCAL_ID}/platos/p2/f.webp`,
    );
    expect(carta!.menus.map((m) => m.nombre)).toEqual(["Menú del día", "Fin de semana"]);
  });

  it("etiqueta la caché con la carta y el local, por horas", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: filaCompleta() } } });
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    await obtenerCartaPublica("la-guagua");
    const etiquetas = nextCache.cacheTag.mock.calls.flat();
    expect(etiquetas).toContain("carta:la-guagua");
    expect(etiquetas).toContain(`local:${LOCAL_ID}`);
    expect(nextCache.cacheLife).toHaveBeenCalledWith("hours");
  });

  it("pide solo columnas públicas en una consulta anidada", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: filaCompleta() } } });
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    await obtenerCartaPublica("la-guagua");
    expect(falso.llamadas).toHaveLength(1);
    const select = falso.metodosDe("locales")[0].find((m) => m.metodo === "select")!.args[0] as string;
    expect(select).toContain("secciones(");
    expect(select).toContain("platos!platos_seccion_fk(");
    expect(select).toContain("menus(");
    expect(select).not.toContain("dueno_id");
    expect(select).not.toContain("creado_en");
    expect(select).not.toContain("*");
  });

  it("devuelve null si no existe (y aun así etiqueta la carta)", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: null } } });
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    expect(await obtenerCartaPublica("no-existe")).toBeNull();
    expect(nextCache.cacheTag.mock.calls.flat()).toEqual(["carta:no-existe"]);
  });

  it("no consulta si el slug no tiene formato válido", async () => {
    const falso = crearSupabaseFalso();
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    expect(await obtenerCartaPublica("../../etc")).toBeNull();
    expect(falso.llamadas).toHaveLength(0);
  });

  it("lanza si falla la base de datos (para no cachear un «no existe» falso)", async () => {
    const falso = crearSupabaseFalso({ tablas: { locales: { data: null, error: { code: "500", message: "caído" } } } });
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    await expect(obtenerCartaPublica("la-guagua")).rejects.toThrow();
  });
});

describe("buscarSlugActual", () => {
  it("devuelve el slug actual de un slug antiguo y etiqueta la caché", async () => {
    const falso = crearSupabaseFalso({ tablas: { slugs_anteriores: { data: { local_id: LOCAL_ID, locales: { slug: "la-guagua" } } } } });
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    expect(await buscarSlugActual("guagua-vieja")).toBe("la-guagua");
    expect(nextCache.cacheTag.mock.calls.flat()).toEqual(expect.arrayContaining(["carta:guagua-vieja", `local:${LOCAL_ID}`]));
  });

  it("null si no hay slug antiguo o apunta a sí mismo", async () => {
    servidor.crearClientePublico.mockReturnValue(crearSupabaseFalso({ tablas: { slugs_anteriores: { data: null } } }).cliente);
    expect(await buscarSlugActual("nada")).toBeNull();
    servidor.crearClientePublico.mockReturnValue(
      crearSupabaseFalso({ tablas: { slugs_anteriores: { data: { local_id: LOCAL_ID, locales: { slug: "igual" } } } } }).cliente,
    );
    expect(await buscarSlugActual("igual")).toBeNull();
  });
});

describe("listarCartasIndexables", () => {
  it("solo locales con 5 o más platos visibles; lastmod = lo más reciente", async () => {
    const platos = (n: number, fecha = "2026-10-05T00:00:00+00:00") =>
      Array.from({ length: n }, (_, i) => ({ id: `p${i}`, actualizado_en: fecha }));
    const falso = crearSupabaseFalso({
      tablas: {
        locales: {
          data: [
            { slug: "con-cinco", actualizado_en: "2026-10-01T00:00:00+00:00", platos: [...platos(4), ...platos(1, "2026-10-09T00:00:00+00:00")] },
            { slug: "con-cuatro", actualizado_en: "2026-10-01T00:00:00+00:00", platos: platos(4) },
          ],
        },
      },
    });
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    expect(await listarCartasIndexables()).toEqual([
      { slug: "con-cinco", idiomas: ["es"], actualizadoEn: "2026-10-09T00:00:00+00:00" },
    ]);
    expect(nextCache.cacheTag).toHaveBeenCalledWith("cartas");
    const metodos = falso.metodosDe("locales")[0];
    expect(metodos).toContainEqual({ metodo: "eq", args: ["permitir_indexar", true] });
  });

  it("añade los idiomas activos con >= 90 % de nombres de plato traducidos", async () => {
    const tr = (texto: string) => ({ texto, origen: "auto", huella: "0123456789abcdef", fecha: "2026-11-02T10:00:00Z" });
    const platos = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      actualizado_en: "2026-10-05T00:00:00+00:00",
      traducciones: {
        ...(i < 9 ? { en: { nombre: tr(`Dish ${i}`) } } : {}),
        ...(i < 8 ? { fr: { nombre: tr(`Plat ${i}`) } } : {}),
        gl: { nombre: tr(`Prato ${i}`) },
      },
    }));
    const falso = crearSupabaseFalso({
      tablas: {
        locales: { data: [{ slug: "la-guagua", actualizado_en: "2026-10-01T00:00:00+00:00", idiomas_activos: ["es", "en", "fr"], platos }] },
      },
    });
    servidor.crearClientePublico.mockReturnValue(falso.cliente);
    const [carta] = await listarCartasIndexables();
    // en: 9/10 (sí); fr: 8/10 (no); gl: traducido pero no activo (no)
    expect(carta.idiomas).toEqual(["es", "en"]);
    const select = falso.metodosDe("locales")[0].find((m) => m.metodo === "select")!.args[0] as string;
    expect(select).toContain("idiomas_activos");
    expect(select).toContain("traducciones");
  });
});
