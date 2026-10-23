"use client";

import { useState } from "react";
import { IconoAlergeno } from "@/componentes/alergenos/IconoAlergeno";
import { ALERGENOS } from "@/lib/dominio/alergenos";
import { cartaEs } from "@/lib/i18n/carta.es";
import type { CodigoAlergeno } from "@/lib/tipos/dominio";

/** Alterna `codigo` en la lista y la devuelve en el orden oficial del anexo II. */
export function alternarCodigo<T extends string>(orden: readonly T[], lista: readonly T[], codigo: T): T[] {
  const nueva = lista.includes(codigo) ? lista.filter((c) => c !== codigo) : [...lista, codigo];
  return orden.filter((c) => nueva.includes(c));
}

/**
 * Rejilla de los 14 alérgenos (icono + nombre oficial) con botones `aria-pressed`.
 * - No controlado con `inicial`, o controlado con `valor` + `onCambiar`.
 * - `name`: envía un `<input type="hidden">` por código marcado.
 * - `tamano`: "normal" (rejilla grande del plato) o "compacto" (trazas y menú del día).
 */
export function SelectorAlergenos({
  etiqueta,
  name,
  inicial = [],
  valor,
  onCambiar,
  tamano = "normal",
}: {
  etiqueta: string;
  name?: string;
  inicial?: CodigoAlergeno[];
  valor?: CodigoAlergeno[];
  onCambiar?: (codigos: CodigoAlergeno[]) => void;
  tamano?: "normal" | "compacto";
}) {
  const [interno, setInterno] = useState<CodigoAlergeno[]>(inicial);
  const actuales = valor ?? interno;
  const compacto = tamano === "compacto";

  function alternar(codigo: CodigoAlergeno) {
    const nueva = alternarCodigo(ALERGENOS, actuales, codigo);
    if (valor === undefined) setInterno(nueva);
    onCambiar?.(nueva);
  }

  return (
    <div
      role="group"
      aria-label={etiqueta}
      className={`grid grid-cols-2 sm:grid-cols-3 ${compacto ? "gap-1.5" : "gap-2"}`}
    >
      {ALERGENOS.map((codigo) => {
        const marcado = actuales.includes(codigo);
        return (
          <button
            key={codigo}
            type="button"
            aria-pressed={marcado}
            onClick={() => alternar(codigo)}
            className={`flex items-center gap-2 rounded-[14px] border-2 text-left font-semibold leading-tight ${
              compacto ? "min-h-12 px-2 py-1 text-sm" : "min-h-14 px-3 py-1.5 text-[0.9375rem]"
            } ${marcado ? "border-primario bg-primario/10 text-primario-hover" : "border-borde bg-superficie text-texto hover:bg-superficie-suave"}`}
          >
            <IconoAlergeno codigo={codigo} tamano={compacto ? 20 : 28} className={`shrink-0 ${marcado ? "text-primario" : "text-texto-suave"}`} />
            <span>{cartaEs.alergenos[codigo]}</span>
          </button>
        );
      })}
      {name ? actuales.map((codigo) => <input key={codigo} type="hidden" name={name} value={codigo} />) : null}
    </div>
  );
}
