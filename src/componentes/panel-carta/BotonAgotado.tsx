"use client";

import { useOptimistic, useState, useTransition } from "react";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import type { Resultado } from "@/lib/tipos/resultado";

const t = panelCartaEs.agotado;

/**
 * «Disponible / Agotado» de un toque. Cambia al momento (useOptimistic) y, si la acción falla,
 * vuelve al valor real y lo avisa. Si sale bien, la página se vuelve a pintar con el valor nuevo.
 */
export function BotonAgotado({
  nombre,
  agotado,
  onCambiar,
}: {
  nombre: string;
  agotado: boolean;
  onCambiar: (agotado: boolean) => Promise<Resultado>;
}) {
  const [visto, setVisto] = useOptimistic(agotado);
  const [fallo, setFallo] = useState(false);
  const [, iniciar] = useTransition();

  function alternar() {
    const nuevo = !visto;
    setFallo(false);
    iniciar(async () => {
      setVisto(nuevo);
      const r = await onCambiar(nuevo);
      if (!r.ok) setFallo(true);
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        aria-pressed={visto}
        aria-label={t.etiqueta(nombre)}
        onClick={alternar}
        className={`inline-flex min-h-12 min-w-28 items-center justify-center rounded-full border-2 px-3 text-[0.9375rem] font-bold ${
          visto ? "border-peligro bg-peligro text-sobre-primario" : "border-exito bg-exito/10 text-exito"
        }`}
      >
        {visto ? t.agotado : t.disponible}
      </button>
      {fallo ? (
        <p role="alert" className="max-w-40 text-right text-xs font-medium text-peligro">
          {t.error(nombre)}
        </p>
      ) : null}
    </div>
  );
}
