import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Casilla de verificación con la etiqueta pulsable entera (zona táctil de 48 px).
 * - `etiqueta` (obligatorio), `ayuda` (texto pequeño debajo), `error` (ya traducido).
 * - `id`: por defecto `casilla-<name>` (o `casilla-<name>-<value>` si hay value).
 * El resto de props van al `<input type="checkbox">` (name, value, defaultChecked, required…).
 */
export function Casilla({
  etiqueta,
  ayuda,
  error,
  id,
  name,
  value,
  className = "",
  ...resto
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
  id?: string;
  name: string;
}) {
  const idFinal = id ?? (value !== undefined ? `casilla-${name}-${String(value)}` : `casilla-${name}`);
  const describe = [ayuda ? `${idFinal}-ayuda` : null, error ? `${idFinal}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={idFinal} className="flex min-h-12 cursor-pointer items-start gap-3 py-2">
        <input
          id={idFinal}
          type="checkbox"
          name={name}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe}
          className="mt-0.5 size-6 shrink-0 cursor-pointer accent-primario"
          {...resto}
        />
        <span>
          {etiqueta}
          {ayuda ? (
            <span id={`${idFinal}-ayuda`} className="block text-sm text-texto-suave">
              {ayuda}
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p id={`${idFinal}-error`} role="alert" className="text-sm font-medium text-peligro">
          {error}
        </p>
      ) : null}
    </div>
  );
}
