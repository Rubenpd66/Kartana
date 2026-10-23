import type { LogoPdf } from "./plantillas/comun";

export const MAX_BYTES_LOGO = 2 * 1024 * 1024;
const ESPERA_MS = 5000;

const FORMATOS = {
  "image/png": { formato: "png", firma: [0x89, 0x50, 0x4e, 0x47] },
  "image/jpeg": { formato: "jpg", firma: [0xff, 0xd8, 0xff] },
} as const;

/**
 * Baja el logo para ponerlo en el PDF. Solo PNG o JPEG (lo único que admite el PDF), de hasta 2 MB
 * y en 5 s. Si algo falla devuelve null y el PDF sale sin logo.
 */
export async function descargarLogo(url: string): Promise<LogoPdf | null> {
  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MS), cache: "no-store" });
    if (!respuesta.ok || !respuesta.body) return null;
    const tipo = (respuesta.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!(tipo in FORMATOS)) return null;
    const declarado = Number(respuesta.headers.get("content-length") ?? 0);
    if (declarado > MAX_BYTES_LOGO) return null;

    const trozos: Uint8Array[] = [];
    let total = 0;
    const lector = respuesta.body.getReader();
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES_LOGO) {
        await lector.cancel();
        return null;
      }
      trozos.push(value);
    }
    const datos = Buffer.concat(trozos);
    const { formato, firma } = FORMATOS[tipo as keyof typeof FORMATOS];
    if (!firma.every((byte, i) => datos[i] === byte)) return null;
    return { datos, formato };
  } catch {
    return null;
  }
}
