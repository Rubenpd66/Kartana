// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const obtenerUsuario = vi.fn();
vi.mock("@/lib/auth/sesion", () => ({ obtenerUsuario: () => obtenerUsuario() }));
const obtenerLocalDelDueno = vi.fn();
vi.mock("@/lib/datos/panel", () => ({ obtenerLocalDelDueno: (id: string) => obtenerLocalDelDueno(id) }));

const { GET: pdf } = await import("./pdf/route");
const { GET: svg } = await import("./svg/route");

const LOCAL_ID = "3f1c2d4e-0000-4000-8000-000000000001";
const LOCAL = { id: LOCAL_ID, slug: "bar-demo", nombre: "Bar Demo", colorMarca: "#2f6b4f", logoRuta: null };

function peticion(formato?: string) {
  const url = new URL(`http://localhost/panel/${LOCAL_ID}/qr/pdf`);
  if (formato !== undefined) url.searchParams.set("formato", formato);
  return Object.assign(new Request(url), { nextUrl: url });
}
const ctx = { params: Promise.resolve({ local: LOCAL_ID }) };

beforeEach(() => {
  vi.clearAllMocks();
  obtenerUsuario.mockResolvedValue({ id: "u1", correo: "a@b.es", esAdmin: false });
  obtenerLocalDelDueno.mockResolvedValue(LOCAL);
});

describe("GET qr/pdf", () => {
  it("formato inválido o ausente -> 400", async () => {
    for (const f of ["tarjeta", "", undefined]) {
      // @ts-expect-error petición mínima para la prueba
      expect((await pdf(peticion(f), ctx)).status).toBe(400);
    }
  });

  it("sin sesión -> 401", async () => {
    obtenerUsuario.mockResolvedValue(null);
    // @ts-expect-error petición mínima para la prueba
    const r = await pdf(peticion("mesa"), ctx);
    expect(r.status).toBe(401);
    expect(obtenerLocalDelDueno).not.toHaveBeenCalled();
  });

  it("local ajeno o inexistente -> 404", async () => {
    obtenerLocalDelDueno.mockResolvedValue(null);
    // @ts-expect-error petición mínima para la prueba
    expect((await pdf(peticion("poster"), ctx)).status).toBe(404);
  });

  it("dueño del local -> PDF descargable y sin caché", async () => {
    // @ts-expect-error petición mínima para la prueba
    const r = await pdf(peticion("pegatinas"), ctx);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("application/pdf");
    expect(r.headers.get("content-disposition")).toContain('filename="kartana-bar-demo-pegatinas.pdf"');
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    expect(Buffer.from(await r.arrayBuffer()).subarray(0, 4).toString()).toBe("%PDF");
  }, 20_000);
});

describe("GET qr/svg", () => {
  it("sin sesión -> 401 y local ajeno -> 404", async () => {
    obtenerUsuario.mockResolvedValue(null);
    // @ts-expect-error petición mínima para la prueba
    expect((await svg(peticion(), ctx)).status).toBe(401);
    obtenerUsuario.mockResolvedValue({ id: "u1", correo: "", esAdmin: false });
    obtenerLocalDelDueno.mockResolvedValue(null);
    // @ts-expect-error petición mínima para la prueba
    expect((await svg(peticion(), ctx)).status).toBe(404);
  });

  it("dueño -> SVG descargable", async () => {
    // @ts-expect-error petición mínima para la prueba
    const r = await svg(peticion(), ctx);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("image/svg+xml");
    expect(await r.text()).toContain("<svg");
  });
});
