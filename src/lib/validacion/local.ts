// Esquemas del local: crear, datos, horarios, logo y publicar. Servidor y navegador.

import { z } from "zod";
import { colorMarcaValido } from "@/lib/dominio/contraste";
import { esRutaLogoDe } from "@/lib/dominio/imagenes";
import { LIMITES, LIMITES_EXTRA } from "@/lib/dominio/limites";
import { validarSlug } from "@/lib/dominio/slugs";
import type { EntradaCrearLocal, EntradaHorarios, EntradaLocal, EntradaLogo, EntradaPublicar } from "@/lib/tipos/carta";
import type { FranjaHoraria } from "@/lib/tipos/dominio";
import { anadirError, esquemaHora, esquemaId, textoObligatorio, textoOpcional } from "./comun";

/** Slug: formato (3–40, minúsculas, números y guiones) y no reservado (código "reservado"). */
export const esquemaSlug = z
  .string()
  .trim()
  .superRefine((slug, ctx) => {
    const r = validarSlug(slug);
    if (!r.valido) anadirError(ctx, [], r.motivo);
  });

/** Color de marca "#rrggbb" (se pasa a minúsculas) con contraste >= 4,5:1 con blanco (código "contraste"). */
export const esquemaColorMarca = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/)
  .refine(colorMarcaValido, { message: "contraste" });

const FORMATO_TELEFONO = /^[0-9+()\s.-]{3,}$/;

export const esquemaCrearLocal = z.object({
  nombre: textoObligatorio(LIMITES.nombreLocal),
  slug: esquemaSlug,
}) satisfies z.ZodType<EntradaCrearLocal>;

export const esquemaLocal = z.object({
  localId: esquemaId,
  nombre: textoObligatorio(LIMITES.nombreLocal),
  slug: esquemaSlug,
  descripcion: textoOpcional(LIMITES.descripcionLocal),
  direccion: textoOpcional(LIMITES.direccion),
  telefono: textoOpcional(LIMITES.telefono).refine((v) => v === null || FORMATO_TELEFONO.test(v), { message: "formato" }),
  colorMarca: esquemaColorMarca,
  permitirIndexar: z.boolean(),
}) satisfies z.ZodType<EntradaLocal>;

const esquemaFranja = z
  .object({
    dia: z.literal([1, 2, 3, 4, 5, 6, 7]),
    abre: esquemaHora,
    cierra: esquemaHora,
  })
  .superRefine((f, ctx) => {
    if (f.abre === f.cierra) anadirError(ctx, ["cierra"], "formato");
  }) satisfies z.ZodType<FranjaHoraria>;

export const esquemaHorarios = z.object({
  localId: esquemaId,
  horarios: z
    .array(esquemaFranja)
    .max(LIMITES_EXTRA.franjasTotal)
    .superRefine((franjas, ctx) => {
      const porDia = new Map<number, number>();
      franjas.forEach((f, i) => {
        const n = (porDia.get(f.dia) ?? 0) + 1;
        porDia.set(f.dia, n);
        if (n > LIMITES.franjasPorDia) anadirError(ctx, [i, "dia"], "fuera_de_rango");
      });
    }),
}) satisfies z.ZodType<EntradaHorarios>;

export const esquemaLogo = z
  .object({
    localId: esquemaId,
    logoRuta: z.string().max(LIMITES_EXTRA.rutaImagen).nullable(),
  })
  .superRefine((e, ctx) => {
    if (e.logoRuta !== null && !esRutaLogoDe(e.localId, e.logoRuta)) anadirError(ctx, ["logoRuta"], "formato");
  }) satisfies z.ZodType<EntradaLogo>;

export const esquemaPublicar = z.object({
  localId: esquemaId,
  publicado: z.boolean(),
}) satisfies z.ZodType<EntradaPublicar>;
