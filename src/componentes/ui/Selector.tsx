import type { ReactNode, SelectHTMLAttributes } from "react";
import { CLASES_ENTRADA, idsCampo } from "./Campo";

export type OpcionSelector = { valor: string; etiqueta: string; desactivada?: boolean };

/**
 * Desplegable nativo con etiqueta, ayuda y error (mismas reglas que `Campo`).
 * - `opciones`: lista de `{ valor, etiqueta, desactivada? }`.
 * - `etiqueta` (obligatorio), `ayuda`, `error` (ya traducido), `id` (por defecto `campo-<name>`).
 * El resto de props van al `<select>` (defaultValue, required, onChange…).
 */
export function Selector({
  etiqueta,
  opciones,
  ayuda,
  error,
  id,
  name,
  className = "",
  ...resto
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> & {
  etiqueta: ReactNode;
  opciones: OpcionSelector[];
  ayuda?: ReactNode;
  error?: string | null;
  id?: string;
  name: string;
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
      <select
        id={idFinal}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe}
        className={`${CLASES_ENTRADA} cursor-pointer`}
        {...resto}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor} disabled={o.desactivada}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      {error ? (
        <p id={ids.error} role="alert" className="mt-1.5 text-sm font-medium text-peligro">
          {error}
        </p>
      ) : null}
    </div>
  );
}
