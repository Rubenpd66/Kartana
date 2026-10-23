import type { EventoEstadistica } from "@/lib/tipos/estadisticas";
import { esquemaEventoEstadistica } from "@/lib/validacion/idiomas";
import { esBot } from "./bots";

export const TAMANO_MAXIMO_EVENTO = 4096;

/** Texto del cuerpo + user-agent -> evento válido, o null si hay que ignorarlo. No guarda ni mira nada más. */
export function procesarEvento(texto: string, userAgent: string | null): EventoEstadistica | null {
  if (new TextEncoder().encode(texto).length > TAMANO_MAXIMO_EVENTO) return null;
  if (esBot(userAgent)) return null;
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return null;
  }
  const r = esquemaEventoEstadistica.safeParse(json);
  return r.success ? r.data : null;
}
