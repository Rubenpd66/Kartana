"use server";

import { refresh } from "next/cache";
import { publicarLocal } from "@/lib/datos/mutaciones";
import type { Resultado } from "@/lib/tipos/resultado";

/** Publica o despublica la carta. La mutación valida, comprueba la sesión e invalida la caché pública. */
export async function cambiarPublicacion(localId: string, publicado: boolean): Promise<Resultado> {
  const r = await publicarLocal({ localId, publicado });
  if (r.ok) refresh();
  return r;
}
