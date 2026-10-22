"use client";

import { useId, useRef, useTransition, type ReactNode } from "react";
import { uiEs as t } from "@/lib/i18n/ui.es";
import { Boton } from "./Boton";

/**
 * Botón de borrar que pide confirmación en un `<dialog>` nativo (Esc y el botón Cancelar lo cierran).
 * - `etiquetaBoton`: texto del botón que abre el diálogo (p. ej. «Borrar plato»).
 * - `titulo` y `descripcion`: lo que se pregunta.
 * - `etiquetaConfirmar`: por defecto «Sí, borrar».
 * - `onConfirmar`: se llama al confirmar (puede ser una acción de servidor envuelta). Mientras corre, el botón carga.
 * - `variante` del botón de apertura: "peligro" (por defecto) o "fantasma".
 */
export function ConfirmarBorrado({
  etiquetaBoton,
  titulo,
  descripcion,
  etiquetaConfirmar = t.confirmarBorrado.borrar,
  onConfirmar,
  variante = "peligro",
  className = "",
}: {
  etiquetaBoton: ReactNode;
  titulo: ReactNode;
  descripcion?: ReactNode;
  etiquetaConfirmar?: ReactNode;
  onConfirmar: () => void | Promise<void>;
  variante?: "peligro" | "fantasma";
  className?: string;
}) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [pendiente, iniciar] = useTransition();

  function abrir() {
    dialogo.current?.showModal();
  }

  function cerrar() {
    dialogo.current?.close();
  }

  function confirmar() {
    iniciar(async () => {
      await onConfirmar();
      cerrar();
    });
  }

  return (
    <>
      <Boton variante={variante} onClick={abrir} className={className}>
        {etiquetaBoton}
      </Boton>
      <dialog
        ref={dialogo}
        aria-labelledby={`${id}-titulo`}
        aria-describedby={descripcion ? `${id}-descripcion` : undefined}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[22px] border border-borde bg-superficie p-6 text-texto backdrop:bg-texto/50"
      >
        <h2 id={`${id}-titulo`} className="text-xl">
          {titulo}
        </h2>
        {descripcion ? (
          <p id={`${id}-descripcion`} className="mt-2 text-texto-suave">
            {descripcion}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton variante="secundario" onClick={cerrar} disabled={pendiente}>
            {t.confirmarBorrado.cancelar}
          </Boton>
          <Boton variante="peligro" onClick={confirmar} cargando={pendiente}>
            {etiquetaConfirmar}
          </Boton>
        </div>
      </dialog>
    </>
  );
}
