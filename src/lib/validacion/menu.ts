// Esquema del menú del día. Servidor y navegador.

import { z } from "zod";
import { LIMITES, LIMITES_EXTRA } from "@/lib/dominio/limites";
import type { EntradaMenu } from "@/lib/tipos/carta";
import {
  anadirError,
  esquemaAlergenos,
  esquemaCentimos,
  esquemaHora,
  esquemaId,
  esquemaIdCorto,
  textoObligatorio,
  textoOpcional,
} from "./comun";

const esquemaItem = z.object({
  id: esquemaIdCorto.optional(),
  nombre: textoObligatorio(LIMITES_EXTRA.nombreItem),
  alergenos: esquemaAlergenos,
  alergenosConfirmados: z.boolean(),
});

const esquemaGrupo = z.object({
  id: esquemaIdCorto.optional(),
  titulo: textoObligatorio(LIMITES_EXTRA.tituloGrupo),
  items: z.array(esquemaItem).max(LIMITES.itemsPorGrupo),
});

/**
 * Menú: horas las dos null (todo el día) o las dos con valor e inicio < fin; días 1..7 sin repetir;
 * ids de grupos e ítems sin repetir en todo el menú (sirven de clave para las traducciones).
 */
export const esquemaMenu = z
  .object({
    localId: esquemaId,
    menuId: esquemaId.optional(),
    nombre: textoObligatorio(LIMITES_EXTRA.nombreMenu),
    precioCentimos: esquemaCentimos.nullable(),
    dias: z
      .array(z.literal([1, 2, 3, 4, 5, 6, 7]))
      .min(1)
      .max(7)
      .superRefine((dias, ctx) => {
        const vistos = new Set<number>();
        dias.forEach((d, i) => {
          if (vistos.has(d)) anadirError(ctx, [i], "duplicado");
          vistos.add(d);
        });
      }),
    horaInicio: esquemaHora.nullable(),
    horaFin: esquemaHora.nullable(),
    grupos: z.array(esquemaGrupo).max(LIMITES.gruposPorMenu),
    notas: textoOpcional(LIMITES_EXTRA.notasMenu),
    visible: z.boolean(),
  })
  .superRefine((m, ctx) => {
    if ((m.horaInicio === null) !== (m.horaFin === null)) {
      anadirError(ctx, [m.horaInicio === null ? "horaInicio" : "horaFin"], "requerido");
    } else if (m.horaInicio !== null && m.horaFin !== null && m.horaInicio >= m.horaFin) {
      anadirError(ctx, ["horaFin"], "fuera_de_rango");
    }
    const grupos = new Set<string>();
    const items = new Set<string>();
    m.grupos.forEach((g, i) => {
      if (g.id !== undefined) {
        if (grupos.has(g.id)) anadirError(ctx, ["grupos", i, "id"], "duplicado");
        grupos.add(g.id);
      }
      g.items.forEach((it, j) => {
        if (it.id === undefined) return;
        if (items.has(it.id)) anadirError(ctx, ["grupos", i, "items", j, "id"], "duplicado");
        items.add(it.id);
      });
    });
  }) satisfies z.ZodType<EntradaMenu>;
