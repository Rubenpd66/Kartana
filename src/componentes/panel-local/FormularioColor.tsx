"use client";

import { useActionState, useId, useState } from "react";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { COLORES_SUGERIDOS, evaluarColor } from "./color";
import { MensajeGuardado } from "./MensajeGuardado";

const t = panelLocalEs.local.color;

/** Bloque «Color de marca»: sugeridos con buen contraste, selector libre y vista previa. No guarda un color ilegible. */
export function FormularioColor({
  inicial,
  nombreLocal,
  guardar,
}: {
  inicial: string;
  nombreLocal: string;
  guardar: (previo: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
}) {
  const id = useId();
  const [estado, accion] = useActionState(guardar, null);
  const [color, setColor] = useState(inicial);
  const evaluado = evaluarColor(color);

  return (
    <Tarjeta aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="mb-4 text-xl">
        {t.titulo}
      </h2>
      <form action={accion} className="space-y-4">
        <input type="hidden" name="colorMarca" value={evaluado.color} />

        <fieldset>
          <legend className="mb-2 font-semibold">{t.sugeridos}</legend>
          <div className="flex flex-wrap gap-2">
            {COLORES_SUGERIDOS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={t.usar(t.nombres[c])}
                aria-pressed={evaluado.color === c}
                style={{ backgroundColor: c }}
                className="size-12 cursor-pointer rounded-full border-2 border-borde aria-pressed:outline-3 aria-pressed:outline-offset-2 aria-pressed:outline-texto"
              />
            ))}
          </div>
        </fieldset>

        <div className="flex min-h-12 items-center gap-3">
          <label htmlFor={`${id}-libre`} className="font-semibold">
            {t.libre}
          </label>
          <input
            id={`${id}-libre`}
            type="color"
            value={evaluado.color.match(/^#[0-9a-f]{6}$/) ? evaluado.color : "#000000"}
            onChange={(e) => setColor(e.target.value)}
            className="size-12 cursor-pointer rounded-[14px] border border-borde bg-superficie p-1"
          />
        </div>

        <div aria-label={t.vista} role="group" className="overflow-hidden rounded-[14px] border border-borde">
          <p className="px-4 py-3 text-lg font-semibold" style={{ backgroundColor: evaluado.color, color: evaluado.texto }}>
            {nombreLocal}
          </p>
          <div className="bg-superficie p-4">
            <span
              className="inline-flex min-h-12 items-center rounded-full px-5 font-semibold"
              style={{ backgroundColor: evaluado.color, color: evaluado.texto }}
            >
              {t.botonEjemplo}
            </span>
          </div>
        </div>

        {evaluado.valido ? (
          <p role="status" className="text-sm text-exito">
            {t.contrasteOk}
          </p>
        ) : (
          <p role="alert" className="text-sm font-medium text-peligro">
            {t.demasiadoClaro}
          </p>
        )}

        <MensajeGuardado estado={estado} />
        <BotonEnviar bloque disabled={!evaluado.valido}>
          {t.guardar}
        </BotonEnviar>
      </form>
    </Tarjeta>
  );
}
