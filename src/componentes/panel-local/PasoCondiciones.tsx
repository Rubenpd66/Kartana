"use client";

import { useActionState, useState } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { Casilla } from "@/componentes/ui/Casilla";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { mensajeCampo, mensajeGeneral } from "./errores";

const t = panelLocalEs.bienvenida;

const ENLACE = "font-semibold text-texto underline";

/** Paso 1 de la bienvenida: aceptar condiciones y privacidad. No deja continuar sin la casilla. */
export function PasoCondiciones({
  aceptar,
}: {
  aceptar: (previo: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
}) {
  const [estado, accion] = useActionState(aceptar, null);
  const [marcada, setMarcada] = useState(false);
  const general = mensajeGeneral(estado);

  return (
    <form action={accion} className="space-y-4" noValidate>
      <p className="text-texto-suave">{t.paso1Texto}</p>
      <Casilla
        name="acepto"
        checked={marcada}
        onChange={(e) => setMarcada(e.target.checked)}
        error={mensajeCampo(estado, "acepto")}
        etiqueta={
          <>
            {t.casilla.leidoAntes}
            <a href="/legal/condiciones" target="_blank" rel="noopener noreferrer" className={ENLACE}>
              {t.casilla.condiciones}
              <span className="sr-only">{t.casilla.nuevaPestana}</span>
            </a>
            {t.casilla.y}
            <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className={ENLACE}>
              {t.casilla.privacidad}
              <span className="sr-only">{t.casilla.nuevaPestana}</span>
            </a>
            .
          </>
        }
      />
      {!marcada ? <p className="text-sm text-texto-suave">{t.debesAceptar}</p> : null}
      {general ? <Aviso variante="error">{general}</Aviso> : null}
      <BotonEnviar tamano="grande" bloque disabled={!marcada}>
        {t.continuar}
      </BotonEnviar>
    </form>
  );
}
