import { beforeEach, describe, expect, it, vi } from "vitest";
import { VERSIONES_LEGALES } from "@/lib/legal/documentos";

vi.mock("server-only", () => ({}));

const obtenerUsuario = vi.fn();
vi.mock("./sesion", () => ({ obtenerUsuario: () => obtenerUsuario() }));

// Cliente simulado: registra las llamadas y devuelve lo que diga cada prueba.
let filas: Array<{ documento: string; version: string; aceptada_en: string }> = [];
let errorLectura: unknown = null;
const insertar = vi.fn();
const eq = vi.fn();
const from = vi.fn((tabla: string) => ({
  tabla,
  select: () => ({
    eq: (col: string, val: string) => {
      eq(col, val);
      return {
        order: () => Promise.resolve({ data: errorLectura ? null : filas, error: errorLectura }),
        then: (ok: (v: unknown) => void) => ok({ data: errorLectura ? null : filas, error: errorLectura }),
      };
    },
  }),
  insert: (fila: unknown) => insertar(fila),
}));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: async () => ({ from }) }));

const { condicionesAlDia, registrarAceptaciones, ultimasAceptaciones } = await import("./aceptaciones");

const AHORA = "2026-10-22T10:00:00Z";

beforeEach(() => {
  vi.clearAllMocks();
  filas = [];
  errorLectura = null;
  obtenerUsuario.mockResolvedValue({ id: "u1", correo: "bar@x.es", esAdmin: false });
  insertar.mockResolvedValue({ error: null });
});

describe("condicionesAlDia", () => {
  it("true si ha aceptado las dos versiones vigentes", async () => {
    filas = [
      { documento: "condiciones", version: VERSIONES_LEGALES.condiciones, aceptada_en: AHORA },
      { documento: "privacidad", version: VERSIONES_LEGALES.privacidad, aceptada_en: AHORA },
    ];
    expect(await condicionesAlDia()).toBe(true);
    expect(from).toHaveBeenCalledWith("aceptaciones_legales");
    expect(eq).toHaveBeenCalledWith("usuario_id", "u1");
  });

  it("false si falta una", async () => {
    filas = [{ documento: "condiciones", version: VERSIONES_LEGALES.condiciones, aceptada_en: AHORA }];
    expect(await condicionesAlDia()).toBe(false);
  });

  it("false si la versión aceptada es antigua", async () => {
    filas = [
      { documento: "condiciones", version: "2020-01-01", aceptada_en: AHORA },
      { documento: "privacidad", version: VERSIONES_LEGALES.privacidad, aceptada_en: AHORA },
    ];
    expect(await condicionesAlDia()).toBe(false);
  });

  it("false sin sesión o con error de lectura", async () => {
    obtenerUsuario.mockResolvedValue(null);
    expect(await condicionesAlDia()).toBe(false);
    obtenerUsuario.mockResolvedValue({ id: "u1", correo: "", esAdmin: false });
    errorLectura = { code: "42P01" };
    expect(await condicionesAlDia()).toBe(false);
  });
});

describe("registrarAceptaciones", () => {
  it("inserta las dos versiones vigentes sin fecha (la pone la base de datos)", async () => {
    expect(await registrarAceptaciones()).toEqual({ ok: true, datos: undefined });
    expect(insertar).toHaveBeenCalledTimes(2);
    expect(insertar).toHaveBeenCalledWith({ usuario_id: "u1", documento: "condiciones", version: VERSIONES_LEGALES.condiciones });
    expect(insertar).toHaveBeenCalledWith({ usuario_id: "u1", documento: "privacidad", version: VERSIONES_LEGALES.privacidad });
  });

  it("ignora los duplicados (23505)", async () => {
    insertar.mockResolvedValueOnce({ error: { code: "23505" } }).mockResolvedValueOnce({ error: null });
    expect(await registrarAceptaciones()).toEqual({ ok: true, datos: undefined });
    expect(insertar).toHaveBeenCalledTimes(2);
  });

  it("otro error devuelve error_servidor", async () => {
    insertar.mockResolvedValue({ error: { code: "42501" } });
    expect(await registrarAceptaciones()).toEqual({ ok: false, error: "error_servidor" });
  });

  it("sin sesión devuelve no_autenticado", async () => {
    obtenerUsuario.mockResolvedValue(null);
    expect(await registrarAceptaciones()).toEqual({ ok: false, error: "no_autenticado" });
    expect(insertar).not.toHaveBeenCalled();
  });
});

describe("ultimasAceptaciones", () => {
  it("devuelve la más reciente de cada documento", async () => {
    filas = [
      { documento: "condiciones", version: "2026-10-22", aceptada_en: "2026-10-22T10:00:00Z" },
      { documento: "condiciones", version: "2026-01-01", aceptada_en: "2026-01-01T10:00:00Z" },
      { documento: "privacidad", version: "2026-10-22", aceptada_en: "2026-10-22T10:00:00Z" },
    ];
    const r = await ultimasAceptaciones();
    expect(r.condiciones).toEqual({ documento: "condiciones", version: "2026-10-22", aceptadaEn: "2026-10-22T10:00:00Z" });
    expect(r.privacidad?.version).toBe("2026-10-22");
  });

  it("vacío sin filas", async () => {
    expect(await ultimasAceptaciones()).toEqual({ condiciones: null, privacidad: null });
  });
});
