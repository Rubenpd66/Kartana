"use client";

import { useState } from "react";
import { ETIQUETAS } from "@/lib/dominio/etiquetas";
import { cartaEs } from "@/lib/i18n/carta.es";
import type { CodigoEtiqueta } from "@/lib/tipos/dominio";
import { alternarCodigo } from "./SelectorAlergenos";

/** Chips de etiquetas del plato (vegano, picante…) con `aria-pressed`. `name` envía un campo oculto por etiqueta marcada. */
export function SelectorEtiquetas({ etiqueta, name, inicial = [] }: { etiqueta: string; name: string; inicial?: CodigoEtiqueta[] }) {
  const [actuales, setActuales] = useState<CodigoEtiqueta[]>(inicial);
  return (
    <div role="group" aria-label={etiqueta} className="flex flex-wrap gap-2">
      {ETIQUETAS.map((codigo) => {
        const marcada = actuales.includes(codigo);
        return (
          <button
            key={codigo}
            type="button"
            aria-pressed={marcada}
            onClick={() => setActuales((lista) => alternarCodigo(ETIQUETAS, lista, codigo))}
            className={`min-h-12 rounded-full border px-4 text-[0.9375rem] font-semibold ${
              marcada ? "border-texto bg-texto text-superficie" : "border-borde bg-superficie text-texto hover:bg-superficie-suave"
            }`}
          >
            {cartaEs.etiquetas[codigo]}
          </button>
        );
      })}
      {actuales.map((codigo) => (
        <input key={codigo} type="hidden" name={name} value={codigo} />
      ))}
    </div>
  );
}
