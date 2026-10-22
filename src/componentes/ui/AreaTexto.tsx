import type { ReactNode, TextareaHTMLAttributes } from "react";
import { CLASES_ENTRADA, idsCampo } from "./Campo";

/**
 * Área de texto con etiqueta, ayuda y error (mismas reglas que `Campo`).
 * - `etiqueta` (obligatorio), `ayuda`, `error` (ya traducido), `id` (por defecto `campo-<name>`).
 * El resto de props van al `<textarea>` (maxLength, rows, defaultValue…).
 */
export function AreaTexto({
  etiqueta,
  ayuda,
  error,
  id,
  name,
  className = "",
  rows = 3,
  ...resto
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  etiqueta: ReactNode;
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
      <textarea
        id={idFinal}
        name={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe}
        className={`${CLASES_ENTRADA} min-h-24 resize-y`}
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
