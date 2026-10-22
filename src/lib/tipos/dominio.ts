// Tipos del dominio de Kartana (solo tipos, sin lógica).
// Fuente de verdad del modelo: docs/arquitectura.md. Los valores en tiempo de
// ejecución (listas de códigos, límites) viven en src/lib/dominio/* (carril datos)
// y deben declararse con `satisfies readonly <Tipo>[]` contra estos tipos.

import type { IdiomaCarta } from "@/lib/i18n/idiomas";

/** Idiomas a los que se traduce (todos menos el idioma base, español). */
export type IdiomaDestino = Exclude<IdiomaCarta, "es">;

/**
 * Los 14 alérgenos del anexo II del Reglamento (UE) 1169/2011.
 * Códigos ESTABLES: se guardan en la base de datos. Nunca se renombran.
 */
export type CodigoAlergeno =
  | "gluten"
  | "crustaceos"
  | "huevos"
  | "pescado"
  | "cacahuetes"
  | "soja"
  | "lacteos"
  | "frutos_cascara"
  | "apio"
  | "mostaza"
  | "sesamo"
  | "sulfitos"
  | "altramuces"
  | "moluscos";

/** Etiquetas informativas del plato (no son alérgenos). Códigos estables. */
export type CodigoEtiqueta =
  | "vegano"
  | "vegetariano"
  | "sin_gluten"
  | "sin_lactosa"
  | "picante"
  | "casero"
  | "recomendado"
  | "nuevo";

/**
 * Etiqueta de una variante de venta de un plato (tapa / media ración / ración, docena…).
 * Las habituales se traducen con el diccionario de la carta (sin Google, sin coste).
 * - "unico": sin etiqueta (el caso simple: un solo precio).
 * - "otro": etiqueta de texto libre escrita por el dueño (`texto`), que se traduce como un
 *   campo más del plato (`precio.<id>.texto`) en la v0.2.
 */
export type FormatoPrecio =
  | "unico"
  | "tapa"
  | "pincho"
  | "media_racion"
  | "racion"
  | "racion_mediana"
  | "racion_grande"
  | "unidad"
  | "media_docena"
  | "docena"
  | "copa"
  | "botella"
  | "jarra"
  | "pequeno"
  | "mediano"
  | "grande"
  | "otro";

/**
 * Una variante de venta de un plato con su precio. Un plato tiene una lista ORDENADA de 1 a 6.
 * Caso simple (el más común): `[{ formato: "unico", texto: null, centimos: 850 }]`.
 * Reglas (las comprueban Zod y un CHECK de SQL):
 * - `formato` "otro" exige `texto` (1-30 caracteres); cualquier otro formato exige `texto` null.
 * - "unico" solo puede usarse si es la única variante.
 * - No se repite el mismo formato (salvo "otro" con textos distintos).
 */
export type Precio = {
  /** Id corto y estable (lo asigna el servidor) para guardar la traducción del texto libre. */
  id: string;
  formato: FormatoPrecio;
  /** Solo con formato "otro". */
  texto: string | null;
  /** Entero en céntimos: 0 … 100000 (1.000 €). null = «según mercado / consultar». */
  centimos: number | null;
};

/** Precio tal como llega del formulario (sin id si es nuevo). */
export type PrecioEntrada = Omit<Precio, "id"> & { id?: string };

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Hora local de Madrid en formato "HH:MM" (24 h). */
export type HoraTexto = string;

/** Una franja de apertura. Hasta 3 franjas por día. `cierra` puede ser menor que `abre` (cierra pasada la medianoche). */
export type FranjaHoraria = {
  dia: DiaSemana;
  abre: HoraTexto;
  cierra: HoraTexto;
};

/** Origen de un texto traducido: automático (Google) o corregido a mano por el dueño. */
export type OrigenTraduccion = "auto" | "manual";

/**
 * Un texto traducido de un campo.
 * - `huella`: 16 primeros caracteres hex del SHA-256 del texto original normalizado
 *   (trim + NFC) en el momento de traducir. Si el original cambia, la huella no coincide
 *   y la traducción está «desactualizada».
 * - Una traducción `manual` NUNCA se sobrescribe de forma automática.
 */
export type TextoTraducido = {
  texto: string;
  origen: OrigenTraduccion;
  huella: string;
  /** ISO 8601. */
  fecha: string;
};

/** Mapa de traducciones de una fila: idioma -> campo -> texto. Columna jsonb `traducciones`. */
export type Traducciones<C extends string> = Partial<Record<IdiomaDestino, Partial<Record<C, TextoTraducido>>>>;

export type CampoTraducibleLocal = "descripcion";
export type CampoTraducibleSeccion = "nombre" | "descripcion";
/** `precio.<id>.texto`: etiqueta libre de una variante con formato "otro". */
export type CampoTraduciblePlato = "nombre" | "descripcion" | `precio.${string}.texto`;
/** En los menús, los campos de grupos e ítems se identifican por su id estable dentro del jsonb. */
export type CampoTraducibleMenu = "nombre" | "notas" | `grupo.${string}.titulo` | `item.${string}.nombre`;

/** Tablas con columna `traducciones`. */
export type TablaTraducible = "locales" | "secciones" | "platos" | "menus";
