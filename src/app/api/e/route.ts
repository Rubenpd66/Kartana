import { registrarEvento } from "@/lib/datos/estadisticas";
import { TAMANO_MAXIMO_EVENTO, procesarEvento } from "@/lib/estadisticas/procesar";

// Recibe los eventos anónimos de la carta (visitas y platos vistos).
// No lee ni guarda IP, ubicación, referer ni cookies, y no escribe el cuerpo en ningún registro.

const RESPUESTA = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

/** Lee el cuerpo como mucho hasta el límite, aunque la cabecera content-length mienta. Devuelve null si se pasa. */
async function leerCuerpoLimitado(request: Request): Promise<string | null> {
  if (!request.body) return null;
  const lector = request.body.getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > TAMANO_MAXIMO_EVENTO) {
        await lector.cancel();
        return null;
      }
      trozos.push(value);
    }
  } catch {
    return null;
  }
  const unido = new Uint8Array(total);
  let pos = 0;
  for (const t of trozos) {
    unido.set(t, pos);
    pos += t.byteLength;
  }
  return new TextDecoder().decode(unido);
}

export async function POST(request: Request) {
  try {
    const largo = Number(request.headers.get("content-length"));
    if (!Number.isFinite(largo) || largo <= 0 || largo > TAMANO_MAXIMO_EVENTO) return RESPUESTA();
    const texto = await leerCuerpoLimitado(request);
    if (texto === null) return RESPUESTA();
    const evento = procesarEvento(texto, request.headers.get("user-agent"));
    if (evento) await registrarEvento(evento);
  } catch {
    // Nunca devolvemos errores al navegador de un cliente: no puede hacer nada con ellos.
  }
  return RESPUESTA();
}
