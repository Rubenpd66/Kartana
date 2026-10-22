import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";

const t = panelLocalEs;

/** Mensaje general de un formulario que ha fallado (nunca el texto técnico). null si no hay error. */
export function mensajeGeneral<T>(estado: EstadoFormulario<T>): string | null {
  if (!estado || estado.ok) return null;
  return t.errores[estado.error] ?? t.errores.error_servidor;
}

/** Mensaje de un campo concreto según el código corto que devuelve el servidor. */
export function mensajeCampo<T>(estado: EstadoFormulario<T>, campo: string): string | null {
  if (!estado || estado.ok) return null;
  const codigo = estado.campos?.[campo];
  if (!codigo) return null;
  return (t.campos as Record<string, string>)[codigo] ?? t.campos.formato;
}

/** ¿Se guardó bien? */
export function guardadoOk<T>(estado: EstadoFormulario<T>): boolean {
  return estado?.ok === true;
}
