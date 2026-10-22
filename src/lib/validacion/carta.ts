// Esquemas de secciones, platos, agotado y orden. Servidor y navegador.

import { z } from "zod";
import { esRutaFotoDe } from "@/lib/dominio/imagenes";
import { LIMITES, LIMITES_EXTRA } from "@/lib/dominio/limites";
import type { EntradaAgotado, EntradaOrden, EntradaPlato, EntradaSeccion } from "@/lib/tipos/carta";
import {
  anadirError,
  esquemaAlergenos,
  esquemaEtiquetas,
  esquemaId,
  esquemaPrecios,
  textoObligatorio,
  textoOpcional,
} from "./comun";

export const esquemaSeccion = z.object({
  localId: esquemaId,
  seccionId: esquemaId.optional(),
  nombre: textoObligatorio(LIMITES.nombreSeccion),
  descripcion: textoOpcional(LIMITES.descripcionSeccion),
  visible: z.boolean(),
}) satisfies z.ZodType<EntradaSeccion>;

/**
 * Plato. La foto debe estar en "<localId>/platos/<platoId>/": si hay foto, hace falta `platoId`
 * (el navegador lo genera antes de subirla).
 */
export const esquemaPlato = z
  .object({
    localId: esquemaId,
    platoId: esquemaId.optional(),
    esNuevo: z.boolean(),
    seccionId: esquemaId,
    nombre: textoObligatorio(LIMITES.nombrePlato),
    descripcion: textoOpcional(LIMITES.descripcionPlato),
    precios: esquemaPrecios,
    alergenos: esquemaAlergenos,
    trazas: esquemaAlergenos,
    alergenosConfirmados: z.boolean(),
    etiquetas: esquemaEtiquetas,
    fotoRuta: z.string().max(LIMITES_EXTRA.rutaImagen).nullable(),
    visible: z.boolean(),
  })
  .superRefine((p, ctx) => {
    if (p.fotoRuta === null) return;
    if (!p.platoId || !esRutaFotoDe(p.localId, p.platoId, p.fotoRuta)) anadirError(ctx, ["fotoRuta"], "formato");
  }) satisfies z.ZodType<EntradaPlato>;

export const esquemaAgotado = z.object({
  localId: esquemaId,
  platoId: esquemaId,
  agotado: z.boolean(),
}) satisfies z.ZodType<EntradaAgotado>;

export const esquemaOrden = z.object({
  localId: esquemaId,
  tabla: z.enum(["secciones", "platos", "menus"]),
  ids: z
    .array(esquemaId)
    .min(1)
    .max(LIMITES_EXTRA.idsPorOrden)
    .superRefine((ids, ctx) => {
      const vistos = new Set<string>();
      ids.forEach((id, i) => {
        if (vistos.has(id)) anadirError(ctx, [i], "duplicado");
        vistos.add(id);
      });
    }),
}) satisfies z.ZodType<EntradaOrden>;
