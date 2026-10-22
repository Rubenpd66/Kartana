import type { ReactNode } from "react";

export type VarianteAviso = "info" | "exito" | "aviso" | "error";

const ESTILOS: Record<VarianteAviso, string> = {
  info: "bg-superficie-suave text-texto",
  exito: "bg-exito/10 text-exito",
  aviso: "bg-aviso/10 text-aviso",
  error: "bg-peligro/10 text-peligro",
};

/**
 * Mensaje en una caja de color.
 * - `variante`: info | exito | aviso | error. «error» usa `role="alert"` (se anuncia al momento);
 *   el resto `role="status"` (se anuncia sin interrumpir).
 * - `titulo` opcional en negrita. `sinRol` quita el rol cuando el aviso es fijo (no aparece tras una acción).
 */
export function Aviso({
  children,
  variante = "info",
  titulo,
  sinRol = false,
  className = "",
}: {
  children: ReactNode;
  variante?: VarianteAviso;
  titulo?: ReactNode;
  sinRol?: boolean;
  className?: string;
}) {
  const rol = sinRol ? undefined : variante === "error" ? "alert" : "status";
  return (
    <div role={rol} className={`rounded-[14px] px-4 py-3 ${ESTILOS[variante]} ${className}`.trim()}>
      {titulo ? <p className="font-semibold">{titulo}</p> : null}
      <div>{children}</div>
    </div>
  );
}
