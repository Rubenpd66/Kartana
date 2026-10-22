import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();
const signInWithOAuth = vi.fn();
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: async () => ({ auth: { signInWithOtp, verifyOtp, signInWithOAuth } }),
}));

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

const { enviarCodigo, verificarCodigo, entrarConGoogle } = await import("./acciones-entrar");

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SITIO_URL = "https://kartana.test";
  signInWithOtp.mockResolvedValue({ data: {}, error: null });
  verifyOtp.mockResolvedValue({ data: {}, error: null });
  signInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.google.com/o/oauth2?x=1" }, error: null });
});

describe("enviarCodigo", () => {
  it("correo inválido -> datos_invalidos sin llamar a Supabase", async () => {
    const r = await enviarCodigo(null, formulario({ correo: "no-es-correo" }));
    expect(r).toMatchObject({ ok: false, error: "datos_invalidos", campos: { correo: "invalido" } });
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("correo demasiado largo -> datos_invalidos", async () => {
    const r = await enviarCodigo(null, formulario({ correo: `${"a".repeat(320)}@x.es` }));
    expect(r).toMatchObject({ ok: false, error: "datos_invalidos" });
  });

  it("correo válido: pide el código creando la cuenta si hace falta y responde con el correo normalizado", async () => {
    const r = await enviarCodigo(null, formulario({ correo: "  Bar@Ejemplo.ES " }));
    expect(r).toEqual({ ok: true, datos: { correo: "bar@ejemplo.es" } });
    expect(signInWithOtp).toHaveBeenCalledWith({ email: "bar@ejemplo.es", options: { shouldCreateUser: true } });
  });

  it("límite de envíos -> limite_alcanzado", async () => {
    signInWithOtp.mockResolvedValue({ data: {}, error: { code: "over_email_send_rate_limit", status: 429 } });
    expect(await enviarCodigo(null, formulario({ correo: "bar@x.es" }))).toEqual({ ok: false, error: "limite_alcanzado" });
  });

  it("otro error -> error_servidor (sin mensaje técnico)", async () => {
    signInWithOtp.mockResolvedValue({ data: {}, error: { code: "unexpected_failure", status: 500, message: "smtp" } });
    expect(await enviarCodigo(null, formulario({ correo: "bar@x.es" }))).toEqual({ ok: false, error: "error_servidor" });
  });
});

describe("verificarCodigo", () => {
  it("código con letras -> datos_invalidos", async () => {
    const r = await verificarCodigo(null, formulario({ correo: "bar@x.es", codigo: "12a456" }));
    expect(r).toMatchObject({ ok: false, error: "datos_invalidos", campos: { codigo: "formato" } });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("código de 5 cifras -> datos_invalidos", async () => {
    const r = await verificarCodigo(null, formulario({ correo: "bar@x.es", codigo: "12345" }));
    expect(r).toMatchObject({ ok: false, error: "datos_invalidos" });
  });

  it("código correcto -> verifica y redirige a siguiente", async () => {
    await expect(
      verificarCodigo(null, formulario({ correo: "Bar@x.es", codigo: "482 913", siguiente: "/panel/abc" })),
    ).rejects.toThrow("REDIRECT /panel/abc");
    expect(verifyOtp).toHaveBeenCalledWith({ email: "bar@x.es", token: "482913", type: "email" });
  });

  it("siguiente externo -> /panel", async () => {
    await expect(
      verificarCodigo(null, formulario({ correo: "bar@x.es", codigo: "482913", siguiente: "//malo.com" })),
    ).rejects.toThrow("REDIRECT /panel");
    expect(redirect).toHaveBeenCalledWith("/panel");
  });

  it("código incorrecto o caducado -> datos_invalidos en el campo código", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: { code: "otp_expired", status: 403 } });
    const r = await verificarCodigo(null, formulario({ correo: "bar@x.es", codigo: "000000" }));
    expect(r).toEqual({ ok: false, error: "datos_invalidos", campos: { codigo: "incorrecto" } });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("demasiados intentos -> limite_alcanzado", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: { code: "over_request_rate_limit", status: 429 } });
    const r = await verificarCodigo(null, formulario({ correo: "bar@x.es", codigo: "000000" }));
    expect(r).toEqual({ ok: false, error: "limite_alcanzado" });
  });
});

describe("entrarConGoogle", () => {
  it("redirige a Google con la vuelta a /auth/callback y siguiente validado", async () => {
    await expect(entrarConGoogle(formulario({ siguiente: "/panel/abc" }))).rejects.toThrow(
      "REDIRECT https://accounts.google.com/o/oauth2?x=1",
    );
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://kartana.test/auth/callback?siguiente=%2Fpanel%2Fabc" },
    });
  });

  it("siguiente externo se cambia por /panel", async () => {
    await expect(entrarConGoogle(formulario({ siguiente: "https://malo.com" }))).rejects.toThrow("REDIRECT");
    expect(signInWithOAuth.mock.calls[0][0].options.redirectTo).toBe(
      "https://kartana.test/auth/callback?siguiente=%2Fpanel",
    );
  });

  it("si Supabase falla, va a /auth/error", async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: null }, error: { code: "provider_disabled" } });
    await expect(entrarConGoogle(formulario({}))).rejects.toThrow("REDIRECT /auth/error");
  });
});
