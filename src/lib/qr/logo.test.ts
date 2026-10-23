// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { descargarLogo, MAX_BYTES_LOGO } from "./logo";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);

function respuesta(cuerpo: Buffer | string, tipo: string, extra: Record<string, string> = {}) {
  return new Response(new Uint8Array(Buffer.from(cuerpo)), { status: 200, headers: { "content-type": tipo, ...extra } });
}

afterEach(() => vi.unstubAllGlobals());

describe("descargarLogo", () => {
  it("devuelve un PNG correcto", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respuesta(PNG, "image/png")));
    const logo = await descargarLogo("https://x.test/logo.png");
    expect(logo?.formato).toBe("png");
    expect(logo?.datos.equals(PNG)).toBe(true);
  });

  it("acepta JPEG", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respuesta(JPG, "image/jpeg")));
    expect((await descargarLogo("https://x.test/logo.jpg"))?.formato).toBe("jpg");
  });

  it("descarta otros tipos (webp, svg, html)", async () => {
    for (const tipo of ["image/webp", "image/svg+xml", "text/html"]) {
      vi.stubGlobal("fetch", vi.fn(async () => respuesta(PNG, tipo)));
      expect(await descargarLogo("https://x.test/l")).toBeNull();
    }
  });

  it("descarta si el contenido no es lo que dice el tipo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respuesta("<html>", "image/png")));
    expect(await descargarLogo("https://x.test/l")).toBeNull();
  });

  it("descarta si pesa más de 2 MB (por cabecera y por contenido)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respuesta(PNG, "image/png", { "content-length": String(MAX_BYTES_LOGO + 1) })));
    expect(await descargarLogo("https://x.test/l")).toBeNull();
    const grande = Buffer.concat([PNG, Buffer.alloc(MAX_BYTES_LOGO)]);
    vi.stubGlobal("fetch", vi.fn(async () => respuesta(grande, "image/png")));
    expect(await descargarLogo("https://x.test/l")).toBeNull();
  });

  it("descarta si la respuesta falla o la red se cae", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 404 })));
    expect(await descargarLogo("https://x.test/l")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("red"); }));
    expect(await descargarLogo("https://x.test/l")).toBeNull();
  });
});
