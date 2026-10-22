"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Boton } from "./Boton";

/**
 * Botón `submit` que se pone solo en «cargando» mientras su formulario se envía (useFormStatus).
 * Mismas props que `Boton` salvo `type` y `cargando`. Debe ir dentro de un `<form>`.
 */
export function BotonEnviar(props: Omit<ComponentProps<typeof Boton>, "type" | "cargando">) {
  const { pending } = useFormStatus();
  return <Boton {...props} type="submit" cargando={pending} />;
}
