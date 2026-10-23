"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { Insignia, type VarianteInsignia } from "@/componentes/ui/Insignia";
import { panelIdiomasEs } from "@/lib/i18n/panel-idiomas.es";
import type { IdiomaDestino, TablaTraducible } from "@/lib/tipos/dominio";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import type { EstadoCampoTraduccion } from "@/lib/tipos/traduccion";
import { MensajeEstado } from "./mensajes";

const t = panelIdiomasEs.textos;

const VARIANTE: Record<EstadoCampoTraduccion, VarianteInsignia> = {
  al_dia_auto: "neutra",
  desactualizada_auto: "neutra",
  al_dia_manual: "exito",
  desactualizada_manual: "aviso",
  falta: "peligro",
};

type Accion = (previo: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;

/**
 * Un texto de la carta en un idioma: original en español (pequeño), traducción editable e insignia de estado.
 * Guardar la deja como «Corregida por ti»; «Volver a la automática» quita la corrección.
 */
export function CampoTraduccion({
  localId,
  tabla,
  filaId,
  campo,
  idioma,
  rotulo,
  original,
  traduccion,
  estado,
  guardar,
  descartar,
}: {
  localId: string;
  tabla: TablaTraducible;
  filaId: string;
  campo: string;
  idioma: IdiomaDestino;
  /** «Nombre», «Descripción»… ya con el idioma si hace falta. */
  rotulo: string;
  original: string;
  traduccion: string;
  estado: EstadoCampoTraduccion;
  guardar: Accion;
  descartar: Accion;
}) {
  const id = useId();
  const [mostrado, setMostrado] = useState<EstadoCampoTraduccion>(estado);
  const [valor, setValor] = useState(traduccion);
  const area = useRef<HTMLTextAreaElement>(null);

  // Cuando el servidor manda datos nuevos (tras refrescar), se queda con ellos.
  useEffect(() => {
    setMostrado(estado);
    setValor(traduccion);
  }, [estado, traduccion]);

  // El área de texto crece con lo que se escribe.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [valor]);

  const [mensaje, setMensaje] = useState<EstadoFormulario>(null);
  const [, accionGuardar] = useActionState<EstadoFormulario, FormData>(async (previo, datos) => {
    const r = await guardar(previo, datos);
    if (r?.ok) setMostrado("al_dia_manual");
    setMensaje(r);
    return r;
  }, null);
  const [, accionDescartar] = useActionState<EstadoFormulario, FormData>(async (previo, datos) => {
    const r = await descartar(previo, datos);
    if (r?.ok) {
      setMostrado("falta");
      setValor("");
    }
    setMensaje(r);
    return r;
  }, null);

  const esManual = mostrado === "al_dia_manual" || mostrado === "desactualizada_manual";
  const identidad = (
    <>
      <input type="hidden" name="localId" value={localId} />
      <input type="hidden" name="tabla" value={tabla} />
      <input type="hidden" name="filaId" value={filaId} />
      <input type="hidden" name="campo" value={campo} />
      <input type="hidden" name="idioma" value={idioma} />
    </>
  );

  return (
    <div className="space-y-2 border-t border-borde pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`${id}-texto`} className="font-semibold">
          {rotulo}
        </label>
        <Insignia variante={VARIANTE[mostrado]}>{t.insignias[mostrado]}</Insignia>
      </div>
      <p className="text-sm text-texto-suave">
        <span className="font-semibold">{t.original}</span> {original}
      </p>
      {mostrado === "desactualizada_manual" ? <p className="text-sm text-aviso">{t.ayudaRevisar}</p> : null}
      <form action={accionGuardar} className="space-y-2">
        {identidad}
        <textarea
          ref={area}
          id={`${id}-texto`}
          name="texto"
          rows={1}
          value={valor}
          maxLength={1000}
          onChange={(e) => setValor(e.target.value)}
          className="block min-h-12 w-full resize-none overflow-hidden rounded-[14px] border border-borde bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        />
        <MensajeEstado estado={mensaje} />
        <div className="flex flex-wrap gap-2">
          <BotonEnviar variante="secundario" disabled={valor.trim() === ""}>
            {t.guardar}
          </BotonEnviar>
        </div>
      </form>
      {esManual ? (
        <form action={accionDescartar}>
          {identidad}
          <BotonEnviar variante="fantasma">{t.volverAutomatica}</BotonEnviar>
        </form>
      ) : null}
    </div>
  );
}
