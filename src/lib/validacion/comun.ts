// Piezas comunes de los esquemas Zod (servidor y navegador). Sin `server-only`.

import { z } from "zod";
import { ALERGENOS } from "@/lib/dominio/alergenos";
import { ETIQUETAS } from "@/lib/dominio/etiquetas";
import { LIMITES } from "@/lib/dominio/limites";
import { FORMATOS_PRECIO } from "@/lib/dominio/precios";
import type { CodigoAlergeno, CodigoEtiqueta, PrecioEntrada } from "@/lib/tipos/dominio";

/**
 * Códigos cortos de error por campo (los traduce el diccionario de cada módulo).
 * Además de los cinco del encargo, "reservado" (slug reservado) y "contraste" (color de marca poco legible).
 */
export type CodigoCampo =
  | "requerido"
  | "demasiado_largo"
  | "formato"
  | "fuera_de_rango"
  | "duplicado"
  | "reservado"
  | "contraste";

const CODIGOS_PROPIOS: readonly string[] = ["requerido", "demasiado_largo", "formato", "fuera_de_rango", "duplicado", "reservado", "contraste"];

function codigoDeIssue(issue: z.core.$ZodIssue): CodigoCampo {
  switch (issue.code) {
    case "invalid_type":
      // `int` = número con decimales; el resto, casi siempre un campo que falta o viene null.
      return issue.expected === "int" ? "formato" : "requerido";
    case "too_small":
      return issue.origin === "number" || issue.origin === "int" ? "fuera_de_rango" : "requerido";
    case "too_big":
      return issue.origin === "number" || issue.origin === "int" ? "fuera_de_rango" : "demasiado_largo";
    case "custom":
      return CODIGOS_PROPIOS.includes(issue.message) ? (issue.message as CodigoCampo) : "formato";
    default:
      return "formato";
  }
}

/**
 * Errores de Zod -> { "campo": "codigo" } para el formulario. Rutas anidadas con puntos ("precios.0.texto").
 * Si un campo tiene varios errores, se queda el primero. Errores sin campo van en "_".
 */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of error.issues) {
    const clave = issue.path.length > 0 ? issue.path.map(String).join(".") : "_";
    if (!(clave in campos)) campos[clave] = codigoDeIssue(issue);
  }
  return campos;
}

/** Añade un error propio en una ruta (dentro de superRefine). */
export function anadirError(ctx: z.RefinementCtx, path: (string | number)[], codigo: CodigoCampo) {
  ctx.addIssue({ code: "custom", message: codigo, path });
}

/** Id de fila (uuid). `z.guid()` acepta cualquier uuid con forma 8-4-4-4-12 (también los fijos de la semilla). */
export const esquemaId = z.guid();

/** Id corto y estable de variantes de precio, grupos e ítems de menú (lo asigna el servidor). */
export const esquemaIdCorto = z.string().regex(/^[a-z0-9]{4,12}$/);

/** Texto obligatorio: se recortan espacios; 1..max caracteres. */
export const textoObligatorio = (max: number) => z.string().trim().min(1).max(max);

/** Texto opcional: se recortan espacios y "" se guarda como null. */
export const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v === "" ? null : v));

/** Hora "HH:MM" de 00:00 a 23:59. */
export const esquemaHora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Céntimos: entero 0..100000. */
export const esquemaCentimos = z.number().int().min(0).max(LIMITES.centimosMax);

function sinRepetidos<T>(lista: T[], ctx: z.RefinementCtx) {
  const vistos = new Set<T>();
  lista.forEach((valor, i) => {
    if (vistos.has(valor)) anadirError(ctx, [i], "duplicado");
    vistos.add(valor);
  });
}

export const esquemaAlergenos = z
  .array(z.enum(ALERGENOS))
  .max(ALERGENOS.length)
  .superRefine(sinRepetidos) satisfies z.ZodType<CodigoAlergeno[]>;

export const esquemaEtiquetas = z
  .array(z.enum(ETIQUETAS))
  .max(ETIQUETAS.length)
  .superRefine(sinRepetidos) satisfies z.ZodType<CodigoEtiqueta[]>;

const esquemaVariante = z.object({
  id: esquemaIdCorto.optional(),
  formato: z.enum(FORMATOS_PRECIO),
  texto: z
    .string()
    .trim()
    .max(LIMITES.textoFormatoLibre)
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  centimos: esquemaCentimos.nullable(),
});

/**
 * Variantes de venta de un plato (1..6), mismas reglas que privado.precios_validos en SQL:
 * "otro" exige texto y los demás no lo llevan; "unico" solo si es la única;
 * no se repite un formato salvo "otro" con textos distintos; ids sin repetir.
 */
export const esquemaPrecios = z
  .array(esquemaVariante)
  .min(1)
  .max(LIMITES.preciosPorPlato)
  .superRefine((precios, ctx) => {
    const formatos = new Set<string>();
    const ids = new Set<string>();
    precios.forEach((p, i) => {
      if (p.formato === "otro" && p.texto === null) anadirError(ctx, [i, "texto"], "requerido");
      if (p.formato !== "otro" && p.texto !== null) anadirError(ctx, [i, "texto"], "formato");
      if (p.formato === "unico" && precios.length > 1) anadirError(ctx, [i, "formato"], "formato");
      const clave = p.formato === "otro" ? `otro:${(p.texto ?? "").toLowerCase()}` : p.formato;
      if (formatos.has(clave)) anadirError(ctx, [i, "formato"], "duplicado");
      formatos.add(clave);
      if (p.id !== undefined) {
        if (ids.has(p.id)) anadirError(ctx, [i, "id"], "duplicado");
        ids.add(p.id);
      }
    });
  }) satisfies z.ZodType<PrecioEntrada[]>;
