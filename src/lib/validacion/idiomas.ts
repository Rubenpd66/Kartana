// Esquemas de idiomas, traducciones manuales y eventos de estadísticas (v0.2). Servidor y navegador.

import { z } from "zod";
import { IDIOMAS_CARTA, type IdiomaCarta } from "@/lib/i18n/idiomas";
import type { EntradaIdiomas, EntradaTraduccionManual } from "@/lib/tipos/contratos";
import type { IdiomaDestino, TablaTraducible } from "@/lib/tipos/dominio";
import type { EventoEstadistica } from "@/lib/tipos/estadisticas";
import { anadirError, esquemaId } from "./comun";

/** Máximo de un texto traducido (igual que privado.texto_traducido_valido en SQL). */
export const TEXTO_TRADUCIDO_MAX = 1000;
/** Máximo de platos en un lote de vistas (igual que privado.registrar_estadisticas_def). */
export const PLATOS_POR_EVENTO = 100;

export const TABLAS_TRADUCIBLES = ["locales", "secciones", "platos", "menus"] as const satisfies readonly TablaTraducible[];
export const IDIOMAS_DESTINO = IDIOMAS_CARTA.filter((i): i is IdiomaDestino => i !== "es");

const ID_CORTO = "[a-z0-9]{4,12}";
const PATRONES_CAMPO: Record<TablaTraducible, RegExp> = {
  locales: /^descripcion$/,
  secciones: /^(nombre|descripcion)$/,
  platos: new RegExp(`^(nombre|descripcion|precio\\.${ID_CORTO}\\.texto)$`),
  menus: new RegExp(`^(nombre|notas|grupo\\.${ID_CORTO}\\.titulo|item\\.${ID_CORTO}\\.nombre)$`),
};

/** ¿Es `campo` un campo traducible de `tabla`? (mismas reglas que privado.campo_traducible_valido). */
export function campoTraducibleValido(tabla: TablaTraducible, campo: string): boolean {
  return PATRONES_CAMPO[tabla]?.test(campo) ?? false;
}

export const esquemaIdiomas = z.object({
  localId: esquemaId,
  idiomas: z
    .array(z.enum(IDIOMAS_CARTA))
    .max(IDIOMAS_CARTA.length)
    .superRefine((lista, ctx) => {
      if (new Set(lista).size !== lista.length) anadirError(ctx, [], "duplicado");
    })
    // Siempre con el idioma base y en el orden de IDIOMAS_CARTA.
    .transform((lista): IdiomaCarta[] => IDIOMAS_CARTA.filter((i) => i === "es" || lista.includes(i))),
}) satisfies z.ZodType<EntradaIdiomas>;

const baseTraduccion = {
  localId: esquemaId,
  tabla: z.enum(TABLAS_TRADUCIBLES),
  filaId: esquemaId,
  campo: z.string().max(40),
  idioma: z.enum(IDIOMAS_DESTINO as [IdiomaDestino, ...IdiomaDestino[]]),
};

function comprobarCampo(entrada: { tabla: TablaTraducible; campo: string }, ctx: z.RefinementCtx) {
  if (!campoTraducibleValido(entrada.tabla, entrada.campo)) anadirError(ctx, ["campo"], "formato");
}

export const esquemaTraduccionManual = z
  .object({ ...baseTraduccion, texto: z.string().trim().min(1).max(TEXTO_TRADUCIDO_MAX) })
  .superRefine(comprobarCampo) satisfies z.ZodType<EntradaTraduccionManual>;

export const esquemaDescartarTraduccion = z
  .object(baseTraduccion)
  .superRefine(comprobarCampo) satisfies z.ZodType<Omit<EntradaTraduccionManual, "texto">>;

/** Cuerpo de POST /api/e. Los ids repetidos se quitan (cada plato cuenta una vez por lote). */
export const esquemaEventoEstadistica = z.object({
  tipo: z.enum(["visita", "vistas"]),
  localId: esquemaId,
  idioma: z.enum(IDIOMAS_CARTA),
  platos: z
    .array(esquemaId)
    .max(PLATOS_POR_EVENTO)
    .transform((ids) => [...new Set(ids.map((id) => id.toLowerCase()))]),
}) satisfies z.ZodType<EventoEstadistica>;
