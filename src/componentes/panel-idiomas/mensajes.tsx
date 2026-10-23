import { Aviso } from "@/componentes/ui/Aviso";
import { panelIdiomasEs } from "@/lib/i18n/panel-idiomas.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";

/** Texto en español de un error de acción (nunca el técnico). null si no hay error. */
export function textoError<T>(estado: EstadoFormulario<T>): string | null {
  if (!estado || estado.ok) return null;
  return panelIdiomasEs.errores[estado.error] ?? panelIdiomasEs.errores.error_servidor;
}

/** «Guardado.» o el error, siempre en una zona que anuncian los lectores de pantalla. */
export function MensajeEstado<T>({ estado, textoOk = panelIdiomasEs.guardado }: { estado: EstadoFormulario<T>; textoOk?: string }) {
  const error = textoError(estado);
  if (error) return <Aviso variante="error">{error}</Aviso>;
  return (
    <p role="status" aria-live="polite" className="min-h-6 text-sm font-semibold text-exito">
      {estado?.ok ? textoOk : ""}
    </p>
  );
}
