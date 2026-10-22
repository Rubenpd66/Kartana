import { validarSlug } from "@/lib/dominio/slugs";

/** Resultado de comprobar una dirección; "error" cubre sesión caducada o fallo del servidor. */
export type EstadoDireccion = "libre" | "ocupado" | "reservado" | "formato" | "error";

/** Lo que se ve en pantalla mientras se escribe: añade «vacío» y «comprobando». */
export type EstadoVisible = EstadoDireccion | "vacio" | "comprobando";

/** Comprobación inmediata, sin red: formato y reservadas. null = hay que preguntar al servidor. */
export function comprobacionLocal(slug: string): "vacio" | "formato" | "reservado" | null {
  if (slug === "") return "vacio";
  const r = validarSlug(slug);
  return r.valido ? null : r.motivo;
}

/** Dirección sin protocolo para enseñarla: «kartana-six.vercel.app/c/mi-bar». */
export function direccionPublica(urlBase: string, slug: string): string {
  return `${urlBase.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/c/${slug}`;
}
