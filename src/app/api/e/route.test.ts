// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const registrarEvento = vi.fn();
vi.mock("@/lib/datos/estadisticas", () => ({ registrarEvento: (e: unknown) => registrarEvento(e) }));

const { POST } = await import("./route");

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
const VALIDO = { tipo: "visita", localId: "0b7e4f3a-1111-4222-8333-444455556666", idioma: "es", platos: [] };

function peticion(cuerpo: string, cabeceras: Record<string, string> = {}) {
  return new Request("http://localhost/api/e", {
    method: "POST",
    body: cuerpo,
    headers: { "user-agent": UA, "content-length": String(new TextEncoder().encode(cuerpo).length), ...cabeceras },
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/e", () => {
  it("evento válido: 204 sin cache y lo registra", async () => {
    const r = await POST(peticion(JSON.stringify(VALIDO)));
    expect(r.status).toBe(204);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("set-cookie")).toBeNull();
    expect(registrarEvento).toHaveBeenCalledWith(VALIDO);
  });
  it("basura, JSON roto, bots y cuerpos grandes: 204 y no registra", async () => {
    for (const p of [
      peticion("basura"),
      peticion(JSON.stringify({ ...VALIDO, idioma: "zz" })),
      peticion(JSON.stringify(VALIDO), { "user-agent": "curl/8.0" }),
      peticion(JSON.stringify({ ...VALIDO, x: "a".repeat(5000) })),
      peticion(JSON.stringify(VALIDO), { "content-length": "" }),
    ]) {
      expect((await POST(p)).status).toBe(204);
    }
    expect(registrarEvento).not.toHaveBeenCalled();
  });
  it("content-length mentiroso: corta igualmente", async () => {
    const grande = JSON.stringify({ ...VALIDO, x: "a".repeat(5000) });
    expect((await POST(peticion(grande, { "content-length": "100" }))).status).toBe(204);
    expect(registrarEvento).not.toHaveBeenCalled();
  });
  it("si registrarEvento lanza, sigue siendo 204", async () => {
    registrarEvento.mockRejectedValueOnce(new Error("x"));
    expect((await POST(peticion(JSON.stringify(VALIDO)))).status).toBe(204);
  });
});
