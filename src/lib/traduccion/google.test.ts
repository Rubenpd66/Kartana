import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ErrorTraduccion, desescaparEntidades, traducirTextos, URL_GOOGLE_TRADUCCION } from "./google";

const CLAVE = "clave-de-prueba-123";

function respuesta(estado: number, cuerpo: unknown, cabeceras: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { "content-type": "application/json", ...cabeceras } });
}

function ok(textos: string[]): Response {
  return respuesta(200, { data: { translations: textos.map((translatedText) => ({ translatedText })) } });
}

let fetchFalso: ReturnType<typeof vi.fn<typeof fetch>>;
let esperar: ReturnType<typeof vi.fn<(ms: number) => Promise<void>>>;

beforeEach(() => {
  vi.stubEnv("GOOGLE_CLOUD_API_KEY", CLAVE);
  fetchFalso = vi.fn<typeof fetch>();
  esperar = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("traducirTextos", () => {
  it("envía la clave en la cabecera (no en la URL) y el cuerpo correcto", async () => {
    fetchFalso.mockResolvedValue(ok(["Octopus", "Bread"]));
    const traducidos = await traducirTextos(["Pulpo", "Pan"], "en", { fetch: fetchFalso, esperar });
    expect(traducidos).toEqual(["Octopus", "Bread"]);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFalso.mock.calls[0]!;
    expect(url).toBe(URL_GOOGLE_TRADUCCION);
    expect(String(url)).not.toContain(CLAVE);
    expect(init?.method).toBe("POST");
    const cabeceras = new Headers(init?.headers);
    expect(cabeceras.get("X-Goog-Api-Key")).toBe(CLAVE);
    expect(cabeceras.get("Content-Type")).toContain("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({ q: ["Pulpo", "Pan"], source: "es", target: "en", format: "text" });
  });

  it("usa los códigos de idioma tal cual (ca, eu, gl)", async () => {
    for (const idioma of ["ca", "eu", "gl"] as const) {
      fetchFalso.mockResolvedValueOnce(ok(["x"]));
      await traducirTextos(["Pulpo"], idioma, { fetch: fetchFalso, esperar });
      expect(JSON.parse(String(fetchFalso.mock.lastCall?.[1]?.body)).target).toBe(idioma);
    }
  });

  it("sin textos no llama a Google", async () => {
    expect(await traducirTextos([], "fr", { fetch: fetchFalso, esperar })).toEqual([]);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("reintenta una vez si Google responde 429, esperando lo que pide", async () => {
    fetchFalso.mockResolvedValueOnce(respuesta(429, {}, { "retry-after": "2" })).mockResolvedValueOnce(ok(["Poulpe"]));
    expect(await traducirTextos(["Pulpo"], "fr", { fetch: fetchFalso, esperar })).toEqual(["Poulpe"]);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(esperar).toHaveBeenCalledWith(2000);
  });

  it("reintenta una vez en un 5xx y, si vuelve a fallar, lanza un error sin el texto ni la clave", async () => {
    fetchFalso.mockResolvedValue(respuesta(503, { error: { message: "Pulpo no disponible" } }));
    const error = await traducirTextos(["Pulpo"], "de", { fetch: fetchFalso, esperar }).catch((e: unknown) => e);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(esperar).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(ErrorTraduccion);
    expect(error).toMatchObject({ codigo: "peticion", estado: 503 });
    expect(String((error as Error).message)).not.toContain("Pulpo");
    expect(String((error as Error).message)).not.toContain(CLAVE);
  });

  it("no reintenta en un 400 o 403", async () => {
    fetchFalso.mockResolvedValue(respuesta(403, {}));
    await expect(traducirTextos(["Pulpo"], "de", { fetch: fetchFalso, esperar })).rejects.toMatchObject({ codigo: "peticion", estado: 403 });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(esperar).not.toHaveBeenCalled();
  });

  it("da un error claro si falta la clave y no llama a Google", async () => {
    vi.stubEnv("GOOGLE_CLOUD_API_KEY", "  ");
    await expect(traducirTextos(["Pulpo"], "en", { fetch: fetchFalso, esperar })).rejects.toMatchObject({ codigo: "sin_clave" });
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("falla si la respuesta no trae una traducción por texto", async () => {
    fetchFalso.mockResolvedValue(ok(["solo una"]));
    await expect(traducirTextos(["Pulpo", "Pan"], "en", { fetch: fetchFalso, esperar })).rejects.toMatchObject({ codigo: "respuesta" });
  });

  it("desescapa las entidades HTML que devuelva", async () => {
    fetchFalso.mockResolvedValue(ok(["Fish &amp; chips", "Chef&#39;s &quot;special&quot;", "&lt;b&gt; &#x27;x&#x27;"]));
    expect(await traducirTextos(["a", "b", "c"], "en", { fetch: fetchFalso, esperar })).toEqual([
      "Fish & chips",
      'Chef\'s "special"',
      "<b> 'x'",
    ]);
  });

  it("reintenta una vez si falla la red", async () => {
    fetchFalso.mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(ok(["Pop"]));
    expect(await traducirTextos(["Pulpo"], "ca", { fetch: fetchFalso, esperar })).toEqual(["Pop"]);
  });
});

describe("desescaparEntidades", () => {
  it("no toca el texto normal ni desescapa dos veces", () => {
    expect(desescaparEntidades("Tortilla de patatas")).toBe("Tortilla de patatas");
    expect(desescaparEntidades("&amp;lt;")).toBe("&lt;");
    expect(desescaparEntidades("&#233;t&#xE9;")).toBe("été");
  });
});
