import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const obtenerUsuario = vi.fn();
vi.mock("@/lib/auth/sesion", () => ({ obtenerUsuario: () => obtenerUsuario() }));
const refresh = vi.fn();
vi.mock("next/cache", () => ({ refresh: () => refresh() }));

const datos = {
  actualizarIdiomasActivos: vi.fn(),
  descartarTraduccionManual: vi.fn(),
  guardarTraduccionManual: vi.fn(),
  listarTextosTraducibles: vi.fn(),
};
vi.mock("@/lib/datos/traducciones", () => datos);
const obtenerLocalDelDueno = vi.fn();
vi.mock("@/lib/datos/panel", () => ({ obtenerLocalDelDueno: (id: string) => obtenerLocalDelDueno(id) }));
const traducirLocal = vi.fn();
vi.mock("@/lib/traduccion/traducir-local", () => ({ traducirLocal: (id: string) => traducirLocal(id) }));

const acciones = await import("./acciones");

const LOCAL = "3f1c2d4e-0000-4000-8000-000000000001";
const PLATO = "3f1c2d4e-0000-4000-8000-000000000003";

function formulario(campos: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
  return fd;
}
const campos = { localId: LOCAL, tabla: "platos", filaId: PLATO, campo: "nombre", idioma: "en" };

beforeEach(() => {
  vi.clearAllMocks();
  obtenerUsuario.mockResolvedValue({ id: "u1", correo: "a@b.es", esAdmin: false });
});

describe("sin sesión", () => {
  it("ninguna acción llega a los datos", async () => {
    obtenerUsuario.mockResolvedValue(null);
    expect(await acciones.guardarIdiomasAccion(LOCAL, null, formulario({ idiomas: ["es"] }))).toEqual({ ok: false, error: "no_autenticado" });
    expect(await acciones.traducirAhoraAccion(LOCAL, null)).toEqual({ ok: false, error: "no_autenticado" });
    expect(await acciones.guardarTraduccionAccion(null, formulario({ ...campos, texto: "x" }))).toEqual({ ok: false, error: "no_autenticado" });
    expect(datos.actualizarIdiomasActivos).not.toHaveBeenCalled();
    expect(traducirLocal).not.toHaveBeenCalled();
    expect(datos.guardarTraduccionManual).not.toHaveBeenCalled();
  });
});

describe("guardarIdiomasAccion", () => {
  it("pasa los idiomas marcados y refresca", async () => {
    datos.actualizarIdiomasActivos.mockResolvedValue({ ok: true, datos: undefined });
    const r = await acciones.guardarIdiomasAccion(LOCAL, null, formulario({ idiomas: ["es", "en"] }));
    expect(r?.ok).toBe(true);
    expect(datos.actualizarIdiomasActivos).toHaveBeenCalledWith({ localId: LOCAL, idiomas: ["es", "en"] });
    expect(refresh).toHaveBeenCalled();
  });
  it("devuelve el error de datos sin refrescar", async () => {
    datos.actualizarIdiomasActivos.mockResolvedValue({ ok: false, error: "datos_invalidos" });
    const r = await acciones.guardarIdiomasAccion(LOCAL, null, formulario({ idiomas: ["xx"] }));
    expect(r).toEqual({ ok: false, error: "datos_invalidos" });
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("traducirAhoraAccion", () => {
  it("devuelve el progreso", async () => {
    traducirLocal.mockResolvedValue({ ok: true, datos: { traducidos: 3, caracteres: 40, cortadoPorCuota: false } });
    const r = await acciones.traducirAhoraAccion(LOCAL, null);
    expect(r).toEqual({ ok: true, datos: { traducidos: 3, caracteres: 40, cortadoPorCuota: false } });
  });
  it("servicio apagado", async () => {
    traducirLocal.mockResolvedValue({ ok: false, error: "servicio_apagado" });
    expect(await acciones.traducirAhoraAccion(LOCAL, null)).toEqual({ ok: false, error: "servicio_apagado" });
  });
  it("corte por cuota sigue siendo ok", async () => {
    traducirLocal.mockResolvedValue({ ok: true, datos: { traducidos: 2, caracteres: 10, cortadoPorCuota: true } });
    const r = await acciones.traducirAhoraAccion(LOCAL, null);
    expect(r?.ok && r.datos.cortadoPorCuota).toBe(true);
  });
  it("rechaza un id que no es válido", async () => {
    expect(await acciones.traducirAhoraAccion("no-es-id", null)).toEqual({ ok: false, error: "datos_invalidos" });
    expect(traducirLocal).not.toHaveBeenCalled();
  });
  it("un fallo inesperado no filtra el mensaje", async () => {
    traducirLocal.mockRejectedValue(new Error("secreto técnico"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await acciones.traducirAhoraAccion(LOCAL, null)).toEqual({ ok: false, error: "error_servidor" });
  });
});

describe("guardarTraduccionAccion / descartarTraduccionAccion", () => {
  it("valida y guarda", async () => {
    datos.guardarTraduccionManual.mockResolvedValue({ ok: true, datos: undefined });
    const r = await acciones.guardarTraduccionAccion(null, formulario({ ...campos, texto: "  Spicy potatoes " }));
    expect(r?.ok).toBe(true);
    expect(datos.guardarTraduccionManual).toHaveBeenCalledWith({ ...campos, texto: "Spicy potatoes" });
  });
  it("rechaza vacío, campo inventado e idioma «es» antes de tocar los datos", async () => {
    for (const mala of [{ texto: "  " }, { texto: "x", campo: "precios" }, { texto: "x", idioma: "es" }]) {
      const r = await acciones.guardarTraduccionAccion(null, formulario({ ...campos, ...mala }));
      expect(r).toEqual({ ok: false, error: "datos_invalidos" });
    }
    expect(datos.guardarTraduccionManual).not.toHaveBeenCalled();
  });
  it("descarta la corrección", async () => {
    datos.descartarTraduccionManual.mockResolvedValue({ ok: true, datos: undefined });
    const r = await acciones.descartarTraduccionAccion(null, formulario(campos));
    expect(r?.ok).toBe(true);
    expect(datos.descartarTraduccionManual).toHaveBeenCalledWith(campos);
  });
});

describe("mantenerOriginalAccion", () => {
  const entrada = { localId: LOCAL, tabla: "platos", filaId: PLATO, campo: "nombre", idioma: "en" };
  it("guarda el español como corrección en cada idioma activo", async () => {
    obtenerLocalDelDueno.mockResolvedValue({ idiomasActivos: ["es", "en", "fr"] });
    datos.listarTextosTraducibles.mockResolvedValue([{ tabla: "platos", filaId: PLATO, campo: "nombre", original: "Ajo mataero" }]);
    datos.guardarTraduccionManual.mockResolvedValue({ ok: true, datos: undefined });
    const r = await acciones.mantenerOriginalAccion(null, formulario(entrada));
    expect(r?.ok).toBe(true);
    expect(datos.guardarTraduccionManual).toHaveBeenCalledTimes(2);
    expect(datos.guardarTraduccionManual).toHaveBeenCalledWith({ localId: LOCAL, tabla: "platos", filaId: PLATO, campo: "nombre", idioma: "fr", texto: "Ajo mataero" });
  });
  it("no_encontrado si el local no es del usuario", async () => {
    obtenerLocalDelDueno.mockResolvedValue(null);
    expect(await acciones.mantenerOriginalAccion(null, formulario(entrada))).toEqual({ ok: false, error: "no_encontrado" });
    expect(datos.guardarTraduccionManual).not.toHaveBeenCalled();
  });
});
