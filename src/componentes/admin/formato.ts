import { adminEs as t } from "@/lib/i18n/admin.es";
import type { AccesoEfectivo, EstadoAcceso, FilaAdmin } from "@/lib/tipos/cuentas";

export const ESTADOS_FILTRO = ["prueba", "piloto", "cortesia", "suscripcion", "vencido"] as const;
export type EstadoFiltro = (typeof ESTADOS_FILTRO)[number];

/** Estado que se enseña: un acceso caducado por fecha cuenta como «vencido». */
export function estadoVisible(acceso: AccesoEfectivo): EstadoAcceso {
  return acceso.activo ? acceso.estado : "vencido";
}

/** dd/mm/aaaa en hora de Madrid (estable entre servidor y navegador). */
export function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid" }).format(new Date(iso));
}

/** «Piloto · vence el 12/12/2026 (quedan 18 días)», «Cortesía · sin fin», «Vencido el 30/11/2026». */
export function textoVencimiento(acceso: AccesoEfectivo): string {
  const estado = estadoVisible(acceso);
  const nombre = t.estado[estado];
  if (!acceso.vigenteHasta) return estado === "vencido" ? nombre : `${nombre} · ${t.vencimiento.sinFin}`;
  const fecha = fechaCorta(acceso.vigenteHasta);
  if (estado === "vencido") return `${nombre} ${t.vencimiento.vencidoEl(fecha)}`;
  return `${nombre} · ${t.vencimiento.vence(fecha, acceso.diasRestantes ?? 0)}`;
}

export function resumenEstados(filas: FilaAdmin[]) {
  const cuenta = (e: EstadoAcceso) => filas.filter((f) => estadoVisible(f.acceso) === e).length;
  return {
    locales: filas.length,
    publicados: filas.filter((f) => f.publicado).length,
    prueba: cuenta("prueba"),
    piloto: cuenta("piloto"),
    vencidos: cuenta("vencido"),
  };
}

export function esEstadoFiltro(valor: unknown): valor is EstadoFiltro {
  return typeof valor === "string" && (ESTADOS_FILTRO as readonly string[]).includes(valor);
}

/** Sin estado (o uno desconocido) devuelve todas. */
export function filtrarPorEstado(filas: FilaAdmin[], estado: string | undefined): FilaAdmin[] {
  return esEstadoFiltro(estado) ? filas.filter((f) => estadoVisible(f.acceso) === estado) : filas;
}
