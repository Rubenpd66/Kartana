import type { InputHTMLAttributes, ReactNode } from "react";

/** Clases comunes de las cajas de texto (52 px de alto, borde suave). */
export const CLASES_ENTRADA =
  "block w-full min-h-13 rounded-[14px] border border-borde bg-superficie px-4 py-3 text-texto placeholder:text-texto-suave/70 aria-[invalid=true]:border-peligro disabled:opacity-60";

/** Ids derivados para enlazar etiqueta, ayuda y error. */
export function idsCampo(id: string) {
  return { ayuda: `${id}-ayuda`, error: `${id}-error` };
}

/**
 * Campo de texto con etiqueta visible, ayuda opcional y mensaje de error accesible.
 * - `etiqueta`: texto de la etiqueta (obligatorio).
 * - `ayuda`: texto pequeño bajo la etiqueta.
 * - `error`: mensaje ya traducido; marca `aria-invalid` y se anuncia con `role="alert"`.
 * - `id`: por defecto `campo-<name>`.
 * El resto de props van al `<input>` (type, name, required, autoComplete, inputMode, defaultValue…).
 */
export function Campo({
  etiqueta,
  ayuda,
  error,
  id,
  name,
  className = "",
  claseEntrada = "",
  ...resto
}: Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
  id?: string;
  name: string;
  /** Clases extra para el `<input>` (p. ej. letra grande del código). */
  claseEntrada?: string;
}) {
  const idFinal = id ?? `campo-${name}`;
  const ids = idsCampo(idFinal);
  const describe = [ayuda ? ids.ayuda : null, error ? ids.error : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={idFinal} className="mb-1.5 block font-semibold">
        {etiqueta}
      </label>
      {ayuda ? (
        <p id={ids.ayuda} className="-mt-1 mb-1.5 text-sm text-texto-suave">
          {ayuda}
        </p>
      ) : null}
      <input
        id={idFinal}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe}
        className={`${CLASES_ENTRADA} ${claseEntrada}`.trim()}
        {...resto}
      />
      {error ? (
        <p id={ids.error} role="alert" className="mt-1.5 text-sm font-medium text-peligro">
          {error}
        </p>
      ) : null}
    </div>
  );
}
