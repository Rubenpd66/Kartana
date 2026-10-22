import { Aviso } from "@/componentes/ui/Aviso";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { mensajeGeneral } from "./errores";

/** «Guardado.» o el error en español, siempre en una zona que los lectores de pantalla anuncian. */
export function MensajeGuardado<T>({ estado, textoOk = panelLocalEs.guardado }: { estado: EstadoFormulario<T>; textoOk?: string }) {
  const error = mensajeGeneral(estado);
  if (error) return <Aviso variante="error">{error}</Aviso>;
  return (
    <p role="status" aria-live="polite" className="min-h-6 text-sm font-semibold text-exito">
      {estado?.ok ? textoOk : ""}
    </p>
  );
}
