import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const obtenerUsuario = vi.fn();
vi.mock("@/lib/auth/sesion", () => ({ obtenerUsuario: () => obtenerUsuario() }));

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));

const mutaciones = {
  guardarPlato: vi.fn(),
  borrarPlato: vi.fn(),
  guardarSeccion: vi.fn(),
  borrarSeccion: vi.fn(),
  cambiarAgotado: vi.fn(),
  reordenar: vi.fn(),
};
vi.mock("@/lib/datos/mutaciones", () => mutaciones);

const acciones = await import("./acciones");

const LOCAL = "3f1c2d4e-0000-4000-8000-000000000001";
const SECCION = "3f1c2d4e-0000-4000-8000-000000000002";
const PLATO = "3f1c2d4e-0000-4000-8000-000000000003";

function formulario(cambios: Record<string, string | null> = {}) {
  const base: Record<string, string> = {
    localId: LOCAL,
    platoId: PLATO,
    esNuevo: "true",
    seccionId: SECCION,
    nombre: "Patatas bravas",
    descripcion: "Con alioli",
    "precios.0.formato": "unico",
    "precios.0.importe": "3,75",
    alergenosConfirmados: "true",
    fotoRuta: "",
    visible: "true",
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...base, ...cambios })) if (v !== null) fd.append(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  obtenerUsuario.mockResolvedValue({ id: "u1", correo: "bar@x.es", esAdmin: false });
});

describe("accionGuardarPlato", () => {
  it("pasa una EntradaPlato correcta a guardarPlato y vuelve a la lista", async () => {
    mutaciones.guardarPlato.mockResolvedValue({ ok: true, datos: { platoId: PLATO } });
    const fd = formulario();
    fd.append("alergenos", "huevos");
    fd.append("alergenos", "lacteos");
    fd.append("etiquetas", "vegetariano");
    await expect(acciones.accionGuardarPlato(fd)).rejects.toThrow(`REDIRECT /panel/${LOCAL}/carta?guardado=${PLATO}`);
    expect(mutaciones.guardarPlato).toHaveBeenCalledWith({
      localId: LOCAL,
      platoId: PLATO,
      esNuevo: true,
      seccionId: SECCION,
      nombre: "Patatas bravas",
      descripcion: "Con alioli",
      precios: [{ formato: "unico", texto: null, centimos: 375 }],
      alergenos: ["huevos", "lacteos"],
      trazas: [],
      alergenosConfirmados: true,
      etiquetas: ["vegetariano"],
      fotoRuta: null,
      visible: true,
    });
  });

  it("importe mal escrito: errores por campo sin llamar a la base de datos", async () => {
    const r = await acciones.accionGuardarPlato(formulario({ "precios.0.importe": "tres euros" }));
    expect(r).toEqual({ ok: false, error: "datos_invalidos", campos: { "precios.0.centimos": "formato" } });
    expect(mutaciones.guardarPlato).not.toHaveBeenCalled();
  });

  it("devuelve los errores por campo de la mutación (Zod en el servidor)", async () => {
    mutaciones.guardarPlato.mockResolvedValue({ ok: false, error: "datos_invalidos", campos: { nombre: "requerido" } });
    const r = await acciones.accionGuardarPlato(formulario({ nombre: "" }));
    expect(r).toEqual({ ok: false, error: "datos_invalidos", campos: { nombre: "requerido" } });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("sin sesión no guarda", async () => {
    obtenerUsuario.mockResolvedValue(null);
    expect(await acciones.accionGuardarPlato(formulario())).toEqual({ ok: false, error: "no_autenticado" });
    expect(mutaciones.guardarPlato).not.toHaveBeenCalled();
  });

  it("un localId que no es uuid no se usa para redirigir", async () => {
    mutaciones.guardarPlato.mockResolvedValue({ ok: false, error: "datos_invalidos", campos: { localId: "formato" } });
    const r = await acciones.accionGuardarPlato(formulario({ localId: "../../malo" }));
    expect(r.ok).toBe(false);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("accionBorrarPlato", () => {
  it("borra y vuelve a la lista", async () => {
    mutaciones.borrarPlato.mockResolvedValue({ ok: true, datos: undefined });
    await expect(acciones.accionBorrarPlato(LOCAL, PLATO)).rejects.toThrow(`REDIRECT /panel/${LOCAL}/carta?borrado=1`);
    expect(mutaciones.borrarPlato).toHaveBeenCalledWith(LOCAL, PLATO);
  });

  it("si falla, devuelve el error", async () => {
    mutaciones.borrarPlato.mockResolvedValue({ ok: false, error: "no_encontrado" });
    expect(await acciones.accionBorrarPlato(LOCAL, PLATO)).toEqual({ ok: false, error: "no_encontrado" });
  });

  it("sin sesión no borra", async () => {
    obtenerUsuario.mockResolvedValue(null);
    expect(await acciones.accionBorrarPlato(LOCAL, PLATO)).toEqual({ ok: false, error: "no_autenticado" });
    expect(mutaciones.borrarPlato).not.toHaveBeenCalled();
  });
});

describe("acciones de la lista", () => {
  it("cambiar agotado", async () => {
    mutaciones.cambiarAgotado.mockResolvedValue({ ok: true, datos: undefined });
    const r = await acciones.accionCambiarAgotado({ localId: LOCAL, platoId: PLATO, agotado: true });
    expect(r).toEqual({ ok: true, datos: undefined });
    expect(mutaciones.cambiarAgotado).toHaveBeenCalledWith({ localId: LOCAL, platoId: PLATO, agotado: true });
  });

  it("reordenar", async () => {
    mutaciones.reordenar.mockResolvedValue({ ok: true, datos: undefined });
    await acciones.accionReordenar({ localId: LOCAL, tabla: "platos", ids: [PLATO] });
    expect(mutaciones.reordenar).toHaveBeenCalledWith({ localId: LOCAL, tabla: "platos", ids: [PLATO] });
  });

  it("guardar y borrar sección", async () => {
    mutaciones.guardarSeccion.mockResolvedValue({ ok: true, datos: { seccionId: SECCION } });
    mutaciones.borrarSeccion.mockResolvedValue({ ok: true, datos: undefined });
    const entrada = { localId: LOCAL, nombre: "Tapas", descripcion: null, visible: true };
    expect(await acciones.accionGuardarSeccion(entrada)).toEqual({ ok: true, datos: { seccionId: SECCION } });
    expect(mutaciones.guardarSeccion).toHaveBeenCalledWith(entrada);
    await acciones.accionBorrarSeccion(LOCAL, SECCION);
    expect(mutaciones.borrarSeccion).toHaveBeenCalledWith(LOCAL, SECCION);
  });

  it("sin sesión, ninguna acción llega a la base de datos", async () => {
    obtenerUsuario.mockResolvedValue(null);
    expect(await acciones.accionCambiarAgotado({ localId: LOCAL, platoId: PLATO, agotado: true })).toEqual({ ok: false, error: "no_autenticado" });
    expect(await acciones.accionReordenar({ localId: LOCAL, tabla: "platos", ids: [PLATO] })).toEqual({ ok: false, error: "no_autenticado" });
    expect(await acciones.accionGuardarSeccion({ localId: LOCAL, nombre: "x", descripcion: null, visible: true })).toEqual({
      ok: false,
      error: "no_autenticado",
    });
    expect(await acciones.accionBorrarSeccion(LOCAL, SECCION)).toEqual({ ok: false, error: "no_autenticado" });
    for (const m of Object.values(mutaciones)) expect(m).not.toHaveBeenCalled();
  });
});
