import type { Limites } from "@/lib/tipos/contratos";

/** Límites de la v0.1. Son los mismos números que los CHECK y triggers de SQL (supabase/migrations/*_modelo_v01.sql). */
export const LIMITES = {
  nombreLocal: 80,
  descripcionLocal: 300,
  direccion: 200,
  telefono: 30,
  nombreSeccion: 60,
  descripcionSeccion: 200,
  nombrePlato: 80,
  descripcionPlato: 300,
  preciosPorPlato: 6,
  textoFormatoLibre: 30,
  centimosMax: 100000,
  seccionesPorLocal: 40,
  platosPorLocal: 400,
  menusPorLocal: 10,
  gruposPorMenu: 6,
  itemsPorGrupo: 12,
  franjasPorDia: 3,
  slugMin: 3,
  slugMax: 40,
  localesPorUsuario: 1,
  bytesImagen: 2 * 1024 * 1024,
} as const satisfies Limites;

/** Límites que no están en el contrato `Limites` pero que también comprueba SQL. */
export const LIMITES_EXTRA = {
  nombreMenu: 60,
  notasMenu: 200,
  tituloGrupo: 40,
  nombreItem: 80,
  franjasTotal: 21,
  idsPorOrden: 200,
  rutaImagen: 300,
} as const;
