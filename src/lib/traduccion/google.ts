import "server-only";
import type { IdiomaDestino } from "@/lib/tipos/dominio";

// Cliente mínimo de Google Cloud Translation (Basic, v2, modelo NMT por defecto).
// La clave va en la cabecera X-Goog-Api-Key (no en la URL, para que no salga en registros).
// Nunca se registran ni se meten en errores la clave ni los textos de la carta.

export const URL_GOOGLE_TRADUCCION = "https://translation.googleapis.com/language/translate/v2";

const ESPERA_REINTENTO_MS = 1000;
const ESPERA_MAXIMA_MS = 5000;
const TIEMPO_MAXIMO_MS = 20_000;

export type CodigoErrorTraduccion = "sin_clave" | "peticion" | "respuesta";

export class ErrorTraduccion extends Error {
  readonly codigo: CodigoErrorTraduccion;
  readonly estado?: number;
  constructor(codigo: CodigoErrorTraduccion, estado?: number) {
    super(`traduccion_${codigo}${estado ? `_${estado}` : ""}`);
    this.name = "ErrorTraduccion";
    this.codigo = codigo;
    this.estado = estado;
  }
}

export type OpcionesGoogle = {
  /** Para tests. */
  fetch?: typeof fetch;
  /** Para tests. */
  esperar?: (ms: number) => Promise<void>;
};

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Google puede devolver entidades HTML aunque se pida format "text". Se desescapan una sola vez. */
export function desescaparEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entera, cuerpo: string) => {
    if (cuerpo[0] === "#") {
      const hex = cuerpo[1] === "x" || cuerpo[1] === "X";
      const codigo = Number.parseInt(cuerpo.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(codigo) && codigo > 0 && codigo <= 0x10ffff ? String.fromCodePoint(codigo) : entera;
    }
    return ENTIDADES[cuerpo.toLowerCase()] ?? entera;
  });
}

const esperarDeVerdad = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

function esperaPedida(respuesta: Response): number {
  const segundos = Number(respuesta.headers.get("retry-after"));
  if (!Number.isFinite(segundos) || segundos <= 0) return ESPERA_REINTENTO_MS;
  return Math.min(segundos * 1000, ESPERA_MAXIMA_MS);
}

const reintentable = (estado: number) => estado === 429 || estado >= 500;

/** Traduce del español a `destino`. Devuelve los textos en el mismo orden. Un solo reintento ante 429/5xx o fallo de red. */
export async function traducirTextos(textos: string[], destino: IdiomaDestino, opciones: OpcionesGoogle = {}): Promise<string[]> {
  if (textos.length === 0) return [];
  const clave = process.env.GOOGLE_CLOUD_API_KEY?.trim();
  if (!clave) throw new ErrorTraduccion("sin_clave");

  const hacerFetch = opciones.fetch ?? fetch;
  const esperar = opciones.esperar ?? esperarDeVerdad;
  const peticion = (): Promise<Response> =>
    hacerFetch(URL_GOOGLE_TRADUCCION, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", "X-Goog-Api-Key": clave },
      body: JSON.stringify({ q: textos, source: "es", target: destino, format: "text" }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });

  let respuesta: Response;
  try {
    respuesta = await peticion();
  } catch {
    await esperar(ESPERA_REINTENTO_MS);
    respuesta = await peticion().catch(() => {
      throw new ErrorTraduccion("peticion");
    });
  }
  if (!respuesta.ok && reintentable(respuesta.status)) {
    await esperar(esperaPedida(respuesta));
    respuesta = await peticion().catch(() => {
      throw new ErrorTraduccion("peticion");
    });
  }
  if (!respuesta.ok) throw new ErrorTraduccion("peticion", respuesta.status);

  const cuerpo = (await respuesta.json().catch(() => null)) as { data?: { translations?: Array<{ translatedText?: unknown }> } } | null;
  const traducciones = cuerpo?.data?.translations;
  if (!Array.isArray(traducciones) || traducciones.length !== textos.length) throw new ErrorTraduccion("respuesta");
  return traducciones.map((t) => {
    if (typeof t?.translatedText !== "string") throw new ErrorTraduccion("respuesta");
    return desescaparEntidades(t.translatedText);
  });
}
