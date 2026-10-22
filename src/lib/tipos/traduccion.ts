// Traducción de cartas (v0.2). Solo tipos.

import type { IdiomaDestino, OrigenTraduccion, TablaTraducible, TextoTraducido } from "./dominio";

/** Un texto original de la carta que puede traducirse. */
export type TextoTraducible = {
  tabla: TablaTraducible;
  /** id de la fila (en "locales", el id del local). */
  filaId: string;
  /** Campo: "nombre", "descripcion", "notas", "grupo.<id>.titulo", "item.<id>.nombre". */
  campo: string;
  original: string;
  /** Huella del original actual (ver TextoTraducido.huella). */
  huellaActual: string;
  traducciones: Partial<Record<IdiomaDestino, TextoTraducido>>;
};

/** Estado de un campo en un idioma, para el panel de idiomas. */
export type EstadoCampoTraduccion =
  | "falta" // no hay traducción
  | "al_dia_auto" // automática con huella igual a la actual
  | "al_dia_manual" // corregida a mano, huella igual a la actual
  | "desactualizada_auto" // automática, el original cambió (se retraduce sola)
  | "desactualizada_manual"; // corregida a mano y el original cambió: se avisa, NO se toca

/** Un trabajo de traducción pendiente (resultado de planificar). */
export type Pendiente = {
  tabla: TablaTraducible;
  filaId: string;
  campo: string;
  idioma: IdiomaDestino;
  original: string;
  huella: string;
};

/** Lo que se escribe con la función SQL guardar_traducciones_auto (nunca pisa "manual"). */
export type TraduccionAGuardar = {
  tabla: TablaTraducible;
  filaId: string;
  idioma: IdiomaDestino;
  campo: string;
  texto: string;
  huella: string;
  origen: OrigenTraduccion;
};

export type ResumenTraduccion = {
  idioma: IdiomaDestino;
  total: number;
  faltan: number;
  desactualizadasManual: number;
};

export type ResultadoTraducirLocal = {
  traducidos: number;
  caracteres: number;
  /** true si se paró por la cuota diaria del local o la mensual global. */
  cortadoPorCuota: boolean;
};
