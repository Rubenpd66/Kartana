import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const exigirAdmin = vi.fn();
vi.mock("@/lib/auth/sesion", () => ({ exigirAdmin: () => exigirAdmin() }));

const activarPiloto = vi.fn();
const cambiarEstadoAcceso = vi.fn();
vi.mock("@/lib/datos/admin", () => ({
  activarPiloto: (...a: unknown[]) => activarPiloto(...a),
  cambiarEstadoAcceso: (...a: unknown[]) => cambiarEstadoAcceso(...a),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));

const { activarPilotoAccion, cambiarEstadoAccion } = await import("./acciones");

const ID = "3f2b8c1e-6a4d-4e0b-9c57-1d2e3f4a5b6c";
const ACCESO = { estado: "piloto", plan: "carta", activo: true, diasRestantes: 60, vigenteHasta: "2027-01-01T00:00:00Z" };

beforeEach(() => {
  vi.clearAllMocks();
  exigirAdmin.mockResolvedValue({ id: "u", correo: "a@b.es", esAdmin: true });
  activarPiloto.mockResolvedValue({ ok: true, datos: ACCESO });
  cambiarEstadoAcceso.mockResolvedValue({ ok: true, datos: { ...ACCESO, estado: "cortesia" } });
});

describe("activarPilotoAccion", () => {
  it("no admin: exigirAdmin corta y no se muta nada", async () => {
    exigirAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    await expect(activarPilotoAccion(ID)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(activarPiloto).not.toHaveBeenCalled();
  });
  it("id inválido -> datos_invalidos", async () => {
    expect(await activarPilotoAccion("no-es-id")).toMatchObject({ ok: false, error: "datos_invalidos" });
    expect(activarPiloto).not.toHaveBeenCalled();
  });
  it("ok: muta y revalida /admin", async () => {
    expect(await activarPilotoAccion(ID)).toEqual({ ok: true, datos: ACCESO });
    expect(activarPiloto).toHaveBeenCalledWith(ID);
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });
  it("error de datos se devuelve sin revalidar", async () => {
    activarPiloto.mockResolvedValue({ ok: false, error: "sin_permiso" });
    expect(await activarPilotoAccion(ID)).toEqual({ ok: false, error: "sin_permiso" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("cambiarEstadoAccion", () => {
  it("no admin: no se muta", async () => {
    exigirAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    await expect(cambiarEstadoAccion(ID, "vencido")).rejects.toThrow();
    expect(cambiarEstadoAcceso).not.toHaveBeenCalled();
  });
  it("estado fuera de la lista -> datos_invalidos", async () => {
    expect(await cambiarEstadoAccion(ID, "piloto")).toMatchObject({ ok: false, error: "datos_invalidos" });
    expect(await cambiarEstadoAccion("x", "vencido")).toMatchObject({ ok: false, error: "datos_invalidos" });
    expect(cambiarEstadoAcceso).not.toHaveBeenCalled();
  });
  it("ok", async () => {
    const r = await cambiarEstadoAccion(ID, "cortesia");
    expect(r).toMatchObject({ ok: true });
    expect(cambiarEstadoAcceso).toHaveBeenCalledWith(ID, "cortesia");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });
});
