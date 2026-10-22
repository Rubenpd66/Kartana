"use client";

import { panelCartaEs } from "@/lib/i18n/panel-carta.es";

const t = panelCartaEs.comun;

const CLASE_FLECHA =
  "inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-borde bg-superficie text-lg font-semibold text-texto hover:bg-superficie-suave disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Flechas ↑↓ de 48 px para cambiar el orden de un elemento.
 * `nombre` completa la etiqueta accesible («Subir Patatas bravas»). La primera no sube y la última no baja.
 */
export function FlechasOrden({
  nombre,
  esPrimero,
  esUltimo,
  onMover,
  disabled = false,
  className = "",
}: {
  nombre: string;
  esPrimero: boolean;
  esUltimo: boolean;
  onMover: (delta: -1 | 1) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex gap-1 ${className}`.trim()}>
      <button type="button" className={CLASE_FLECHA} aria-label={t.subir(nombre)} disabled={disabled || esPrimero} onClick={() => onMover(-1)}>
        <span aria-hidden="true">↑</span>
      </button>
      <button type="button" className={CLASE_FLECHA} aria-label={t.bajar(nombre)} disabled={disabled || esUltimo} onClick={() => onMover(1)}>
        <span aria-hidden="true">↓</span>
      </button>
    </span>
  );
}
