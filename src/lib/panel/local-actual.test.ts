import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const exigirUsuario = vi.fn();
vi.mock("@/lib/auth/sesion", () => ({ exigirUsuario: (s?: string) => exigirUsuario(s) }));

const notFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

let respuesta: { data: unknown; error: unknown } = { data: null, error: null };
const filtros: Array<[string, string]> = [];
const select = vi.fn();
const consulta = {
  select: (cols: string) => {
    select(cols);
    return consulta;
  },
  eq: (col: string, val: string) => {
    filtros.push([col, val]);
    return consulta;
  },
  maybeSingle: () => Promise.resolve(respuesta),
};
const from = vi.fn(() => consulta);
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: async () => ({ from }) }));

const { obtenerLocalActual, calcularAccesoLocal } = await import("./local-actual");

const ID = "3f1c2d4e-0000-4000-8000-000000000001";
const AHORA = new Date("2026-10-22T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  filtros.length = 0;
  exigirUsuario.mockResolvedValue({ id: "u1", correo: "bar@x.es", esAdmin: false });
  respuesta = { data: null, error: null };
});

describe("calcularAccesoLocal", () => {
  it("prueba vigente: activo con días restantes redondeados hacia arriba", () => {
    const a = calcularAccesoLocal({ estado: "prueba", plan: "carta_resenas", vigente_hasta: "2026-10-23T13:00:00Z" }, AHORA);
    expect(a).toEqual({ estado: "prueba", plan: "carta_resenas", activo: true, diasRestantes: 2, vigenteHasta: "2026-10-23T13:00:00Z" });
  });

  it("prueba caducada: inactiva con 0 días", () => {
    const a = calcularAccesoLocal({ estado: "prueba", plan: "carta", vigente_hasta: "2026-10-01T00:00:00Z" }, AHORA);
    expect(a.activo).toBe(false);
    expect(a.diasRestantes).toBe(0);
  });

  it("cortesía sin fecha: activa sin días", () => {
    const a = calcularAccesoLocal({ estado: "cortesia", plan: "carta_resenas", vigente_hasta: null }, AHORA);
    expect(a).toMatchObject({ activo: true, diasRestantes: null });
  });

  it("vencido nunca está activo", () => {
    expect(calcularAccesoLocal({ estado: "vencido", plan: "carta", vigente_hasta: null }, AHORA).activo).toBe(false);
  });

  it("sin fila de acceso: vencido", () => {
    expect(calcularAccesoLocal(null, AHORA)).toMatchObject({ estado: "vencido", activo: false });
  });
});

describe("obtenerLocalActual", () => {
  it("devuelve el resumen del local del dueño", async () => {
    respuesta = {
      data: {
        id: ID,
        slug: "la-guagua",
        nombre: "La Guagua",
        publicado: true,
        accesos: { estado: "cortesia", plan: "carta_resenas", vigente_hasta: null },
      },
      error: null,
    };
    const r = await obtenerLocalActual(ID);
    expect(r).toMatchObject({ id: ID, slug: "la-guagua", nombre: "La Guagua", publicado: true, acceso: { activo: true } });
    expect(from).toHaveBeenCalledWith("locales");
    expect(filtros).toContainEqual(["id", ID]);
    expect(filtros).toContainEqual(["dueno_id", "u1"]);
    expect(exigirUsuario).toHaveBeenCalledWith(`/panel/${ID}`);
  });

  it("acepta accesos como lista (PostgREST)", async () => {
    respuesta = {
      data: { id: ID, slug: "x-y", nombre: "X", publicado: false, accesos: [{ estado: "vencido", plan: "carta", vigente_hasta: null }] },
      error: null,
    };
    expect((await obtenerLocalActual(ID)).acceso.estado).toBe("vencido");
  });

  it("notFound si no hay fila (no existe o es de otro)", async () => {
    await expect(obtenerLocalActual(ID)).rejects.toThrow("NOT_FOUND");
  });

  it("notFound si la consulta falla", async () => {
    respuesta = { data: null, error: { code: "42P01" } };
    await expect(obtenerLocalActual(ID)).rejects.toThrow("NOT_FOUND");
  });

  it("notFound sin consultar si el id no es un uuid", async () => {
    await expect(obtenerLocalActual("no-es-uuid")).rejects.toThrow("NOT_FOUND");
    expect(from).not.toHaveBeenCalled();
  });
});
