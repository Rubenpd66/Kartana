import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getClaims = vi.fn();
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: async () => ({ auth: { getClaims } }),
}));

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
const notFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u), notFound: () => notFound() }));

const { obtenerUsuario, exigirUsuario, exigirAdmin } = await import("./sesion");

function conClaims(claims: Record<string, unknown> | null) {
  getClaims.mockResolvedValue(
    claims ? { data: { claims, header: {}, signature: new Uint8Array() }, error: null } : { data: null, error: null },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = "jefa@kartana.es";
});

describe("obtenerUsuario", () => {
  it("sin claims devuelve null", async () => {
    conClaims(null);
    expect(await obtenerUsuario()).toBeNull();
  });

  it("con error devuelve null", async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error("jwt") });
    expect(await obtenerUsuario()).toBeNull();
  });

  it("usuario normal no es admin", async () => {
    conClaims({ sub: "u1", email: "bar@x.es", app_metadata: {} });
    expect(await obtenerUsuario()).toEqual({ id: "u1", correo: "bar@x.es", esAdmin: false });
  });

  it("rol admin pero correo fuera de la lista no es admin", async () => {
    conClaims({ sub: "u2", email: "otro@x.es", app_metadata: { rol: "admin" } });
    expect((await obtenerUsuario())?.esAdmin).toBe(false);
  });

  it("correo en la lista sin rol no es admin", async () => {
    conClaims({ sub: "u3", email: "jefa@kartana.es", app_metadata: {} });
    expect((await obtenerUsuario())?.esAdmin).toBe(false);
  });

  it("rol admin y correo en la lista es admin", async () => {
    conClaims({ sub: "u4", email: "Jefa@Kartana.es", app_metadata: { rol: "admin" } });
    expect((await obtenerUsuario())?.esAdmin).toBe(true);
  });

  it("los anónimos no cuentan como usuarios", async () => {
    conClaims({ sub: "u5", is_anonymous: true });
    expect(await obtenerUsuario()).toBeNull();
  });
});

describe("exigirUsuario", () => {
  it("sin sesión redirige a /entrar con siguiente codificado", async () => {
    conClaims(null);
    await expect(exigirUsuario("/panel/abc?x=1")).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/entrar?siguiente=%2Fpanel%2Fabc%3Fx%3D1");
  });

  it("un siguiente externo se cambia por /panel", async () => {
    conClaims(null);
    await expect(exigirUsuario("//malo.com")).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/entrar?siguiente=%2Fpanel");
  });

  it("con sesión devuelve el usuario", async () => {
    conClaims({ sub: "u1", email: "bar@x.es" });
    expect(await exigirUsuario()).toMatchObject({ id: "u1" });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("exigirAdmin", () => {
  it("un usuario normal recibe notFound", async () => {
    conClaims({ sub: "u1", email: "bar@x.es" });
    await expect(exigirAdmin()).rejects.toThrow("NOT_FOUND");
  });

  it("sin sesión también recibe notFound", async () => {
    conClaims(null);
    await expect(exigirAdmin()).rejects.toThrow("NOT_FOUND");
  });

  it("el admin pasa", async () => {
    conClaims({ sub: "u4", email: "jefa@kartana.es", app_metadata: { rol: "admin" } });
    expect(await exigirAdmin()).toMatchObject({ esAdmin: true });
  });
});
