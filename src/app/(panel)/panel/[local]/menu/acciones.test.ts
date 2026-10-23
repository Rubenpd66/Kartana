import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const obtenerUsuario = vi.fn();
vi.mock("@/lib/auth/sesion", () => ({ obtenerUsuario: () => obtenerUsuario() }));

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));

const mutaciones = { guardarMenu: vi.fn(), borrarMenu: vi.fn(), reordenar: vi.fn() };
vi.mock("@/lib/datos/mutaciones", () => mutaciones);

const { accionBorrarMenu, accionGuardarMenu, accionOrdenarMenus } = await import("./acciones");

const LOCAL = "3f1c2d4e-0000-4000-8000-000000000001";
const MENU = "3f1c2d4e-0000-4000-8000-000000000009";
const ENTRADA = {
  localId: LOCAL,
  nombre: "Menú del día",
  precioCentimos: 1250,
  dias: [1, 2, 3, 4, 5] as Array<1 | 2 | 3 | 4 | 5>,
  horaInicio: null,
  horaFin: null,
  grupos: [{ titulo: "Primeros", items: [] }],
  notas: null,
  visible: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  obtenerUsuario.mockResolvedValue({ id: "u1", correo: "bar@x.es", esAdmin: false });
});

describe("acciones de menús", () => {
  it("guardar pasa la entrada y vuelve a la lista", async () => {
    mutaciones.guardarMenu.mockResolvedValue({ ok: true, datos: { menuId: MENU } });
    await expect(accionGuardarMenu(ENTRADA)).rejects.toThrow(`REDIRECT /panel/${LOCAL}/menu?guardado=${MENU}`);
    expect(mutaciones.guardarMenu).toHaveBeenCalledWith(ENTRADA);
  });

  it("guardar devuelve los errores por campo", async () => {
    mutaciones.guardarMenu.mockResolvedValue({ ok: false, error: "datos_invalidos", campos: { dias: "requerido" } });
    expect(await accionGuardarMenu({ ...ENTRADA, dias: [] })).toEqual({ ok: false, error: "datos_invalidos", campos: { dias: "requerido" } });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("borrar y ordenar", async () => {
    mutaciones.borrarMenu.mockResolvedValue({ ok: true, datos: undefined });
    mutaciones.reordenar.mockResolvedValue({ ok: true, datos: undefined });
    await expect(accionBorrarMenu(LOCAL, MENU)).rejects.toThrow(`REDIRECT /panel/${LOCAL}/menu?borrado=1`);
    expect(await accionOrdenarMenus(LOCAL, [MENU])).toEqual({ ok: true, datos: undefined });
    expect(mutaciones.reordenar).toHaveBeenCalledWith({ localId: LOCAL, tabla: "menus", ids: [MENU] });
  });

  it("sin sesión no toca la base de datos", async () => {
    obtenerUsuario.mockResolvedValue(null);
    expect(await accionGuardarMenu(ENTRADA)).toEqual({ ok: false, error: "no_autenticado" });
    expect(await accionBorrarMenu(LOCAL, MENU)).toEqual({ ok: false, error: "no_autenticado" });
    expect(await accionOrdenarMenus(LOCAL, [MENU])).toEqual({ ok: false, error: "no_autenticado" });
    for (const m of Object.values(mutaciones)) expect(m).not.toHaveBeenCalled();
  });
});
