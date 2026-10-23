"use client";

import { useActionState } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { panelIdiomasEs } from "@/lib/i18n/panel-idiomas.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import type { ResultadoTraducirLocal } from "@/lib/tipos/traduccion";
import { textoError } from "./mensajes";

const t = panelIdiomasEs.idiomas.traducir;

/**
 * «Traducir lo que falta». Si el servicio está apagado (por el interruptor del servidor o porque la acción
 * lo devuelve), explica que el dueño puede escribir las traducciones y deja el botón desactivado.
 */
export function BotonTraducir({
  traducir,
  servicioApagado,
  hayIdiomas,
}: {
  traducir: (previo: EstadoFormulario<ResultadoTraducirLocal>) => Promise<EstadoFormulario<ResultadoTraducirLocal>>;
  servicioApagado: boolean;
  hayIdiomas: boolean;
}) {
  const [estado, accion] = useActionState(traducir, null);
  const apagado = servicioApagado || (estado?.ok === false && estado.error === "servicio_apagado");
  const error = apagado ? null : textoError(estado);

  return (
    <form action={accion} className="space-y-3">
      <BotonEnviar bloque disabled={apagado || !hayIdiomas}>
        {t.boton}
      </BotonEnviar>
      {apagado ? (
        <Aviso variante="info" sinRol>
          {t.apagado}
        </Aviso>
      ) : null}
      <div role="status" aria-live="polite">
        {estado?.ok ? (
          <p className="font-semibold text-exito">{estado.datos.cortadoPorCuota ? t.cuota : t.hecho(estado.datos.traducidos)}</p>
        ) : null}
        {error ? <p className="font-medium text-peligro">{error}</p> : null}
      </div>
    </form>
  );
}
