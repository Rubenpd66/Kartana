"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Interruptor sí/no accesible (`role="switch"` + `aria-checked`), zona táctil de 48 px.
 * - `etiqueta` (obligatorio) y `descripcion` opcional.
 * - Controlado con `activado` + `onCambiar`, o no controlado con `valorInicial`.
 * - `name`: añade un `<input type="hidden">` con "true"/"false" para enviarlo en un formulario.
 */
export function Interruptor({
  etiqueta,
  descripcion,
  activado,
  valorInicial = false,
  onCambiar,
  name,
  disabled = false,
  className = "",
}: {
  etiqueta: ReactNode;
  descripcion?: ReactNode;
  activado?: boolean;
  valorInicial?: boolean;
  onCambiar?: (valor: boolean) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const [interno, setInterno] = useState(valorInicial);
  const valor = activado ?? interno;

  function alternar() {
    if (disabled) return;
    if (activado === undefined) setInterno(!valor);
    onCambiar?.(!valor);
  }

  return (
    <div className={`flex min-h-12 items-center justify-between gap-3 ${className}`}>
      <span>
        <span id={`${id}-etiqueta`} className="font-semibold">
          {etiqueta}
        </span>
        {descripcion ? (
          <span id={`${id}-descripcion`} className="block text-sm text-texto-suave">
            {descripcion}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={valor}
        aria-labelledby={`${id}-etiqueta`}
        aria-describedby={descripcion ? `${id}-descripcion` : undefined}
        disabled={disabled}
        onClick={alternar}
        className={`relative inline-flex h-12 w-16 shrink-0 cursor-pointer items-center rounded-full disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-x-1.5 inset-y-2 rounded-full transition-colors ${valor ? "bg-exito" : "bg-borde"}`}
        />
        <span
          aria-hidden="true"
          className={`absolute left-2.5 size-6 rounded-full bg-superficie shadow transition-transform ${valor ? "translate-x-5" : ""}`}
        />
      </button>
      {name ? <input type="hidden" name={name} value={valor ? "true" : "false"} /> : null}
    </div>
  );
}
