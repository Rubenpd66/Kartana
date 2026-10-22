// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const exchangeCodeForSession = vi.fn();
const signOut = vi.fn();
const signInWithPassword = vi.fn();
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: async () => ({ auth: { exchangeCodeForSession, signOut, signInWithPassword } }),
}));

const callback = await import("./callback/route");
const salir = await import("./salir/route");
const e2e = await import("./e2e/route");

const ENTORNO = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
  signOut.mockResolvedValue({ error: null });
  signInWithPassword.mockResolvedValue({ data: {}, error: null });
  process.env.E2E_ACCESO = "true";
  delete process.env.VERCEL;
  process.env.E2E_EMAIL = "dueno@prueba.es";
  process.env.E2E_PASSWORD = "clave-dueno";
  process.env.E2E_ADMIN_EMAIL = "admin@prueba.es";
  process.env.E2E_ADMIN_PASSWORD = "clave-admin";
});
afterEach(() => {
  process.env = { ...ENTORNO };
});

function peticionE2E(cuerpo: unknown, url = "http://localhost:3100/auth/e2e") {
  return new NextRequest(url, { method: "POST", body: JSON.stringify(cuerpo), headers: { "content-type": "application/json" } });
}

describe("/auth/callback", () => {
  it("canjea el código y redirige a siguiente", async () => {
    const r = await callback.GET(new NextRequest("http://localhost:3000/auth/callback?code=abc&siguiente=%2Fpanel%2Fx"));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toBe("http://localhost:3000/panel/x");
  });

  it("rechaza un siguiente externo y va a /panel", async () => {
    const r = await callback.GET(new NextRequest("http://localhost:3000/auth/callback?code=abc&siguiente=%2F%2Fmalo.com"));
    expect(r.headers.get("location")).toBe("http://localhost:3000/panel");
    const r2 = await callback.GET(new NextRequest("http://localhost:3000/auth/callback?code=abc&siguiente=https%3A%2F%2Fmalo.com"));
    expect(r2.headers.get("location")).toBe("http://localhost:3000/panel");
  });

  it("sin código o con error va a /auth/error", async () => {
    const r = await callback.GET(new NextRequest("http://localhost:3000/auth/callback?error=access_denied"));
    expect(r.headers.get("location")).toBe("http://localhost:3000/auth/error");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: { code: "bad_code_verifier" } });
    const r2 = await callback.GET(new NextRequest("http://localhost:3000/auth/callback?code=abc"));
    expect(r2.headers.get("location")).toBe("http://localhost:3000/auth/error");
  });
});

describe("/auth/salir", () => {
  it("cierra la sesión y lleva a la portada con 303", async () => {
    const r = await salir.POST(new NextRequest("http://localhost:3000/auth/salir", { method: "POST" }));
    expect(signOut).toHaveBeenCalled();
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("solo acepta POST", () => {
    expect("GET" in salir).toBe(false);
  });
});

describe("/auth/e2e", () => {
  it("404 si E2E_ACCESO no es true", async () => {
    delete process.env.E2E_ACCESO;
    const r = await e2e.POST(peticionE2E({ quien: "dueno" }));
    expect(r.status).toBe(404);
    process.env.E2E_ACCESO = "1";
    expect((await e2e.POST(peticionE2E({ quien: "dueno" }))).status).toBe(404);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("404 en Vercel aunque E2E_ACCESO sea true", async () => {
    process.env.VERCEL = "1";
    const r = await e2e.POST(peticionE2E({ quien: "dueno" }));
    expect(r.status).toBe(404);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("404 si no se llama desde localhost", async () => {
    const r = await e2e.POST(peticionE2E({ quien: "dueno" }, "https://kartana.example/auth/e2e"));
    expect(r.status).toBe(404);
  });

  it("400 con un cuerpo no válido", async () => {
    expect((await e2e.POST(peticionE2E({ quien: "otro" }))).status).toBe(400);
    expect((await e2e.POST(peticionE2E({ quien: "dueno", email: "x@y.z", password: "p" }))).status).toBe(400);
  });

  it("inicia sesión con las credenciales del entorno, nunca del cuerpo", async () => {
    const r = await e2e.POST(peticionE2E({ quien: "dueno" }));
    expect(r.status).toBe(204);
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "dueno@prueba.es", password: "clave-dueno" });
    await e2e.POST(peticionE2E({ quien: "admin" }));
    expect(signInWithPassword).toHaveBeenLastCalledWith({ email: "admin@prueba.es", password: "clave-admin" });
  });

  it("401 si Supabase rechaza las credenciales", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { code: "invalid_credentials" } });
    expect((await e2e.POST(peticionE2E({ quien: "dueno" }))).status).toBe(401);
  });

  it("404 si faltan las credenciales en el entorno", async () => {
    delete process.env.E2E_ADMIN_PASSWORD;
    expect((await e2e.POST(peticionE2E({ quien: "admin" }))).status).toBe(404);
  });
});
