"use client";

import { useState } from "react";
import { Boton } from "@/componentes/ui/Boton";

/** Copia `texto` al portapapeles. El resultado se anuncia en una región `aria-live`. */
export function BotonCopiar({
  texto,
  etiqueta,
  copiado,
  error,
}: {
  texto: string;
  etiqueta: string;
  copiado: string;
  error: string;
}) {
  const [mensaje, setMensaje] = useState("");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setMensaje(copiado);
    } catch {
      setMensaje(error);
    }
  }

  return (
    <>
      <Boton variante="secundario" onClick={copiar}>
        {etiqueta}
      </Boton>
      <span role="status" className="text-sm text-texto-suave">
        {mensaje}
      </span>
    </>
  );
}
