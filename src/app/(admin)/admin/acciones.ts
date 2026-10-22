"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/auth/sesion";
import { activarPiloto, cambiarEstadoAcceso } from "@/lib/datos/admin";
import type { AccesoEfectivo } from "@/lib/tipos/cuentas";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { erroresPorCampo, esquemaId } from "@/lib/validacion/comun";

// Cada acción vuelve a comprobar que quien llama es admin (si no, 404) antes de tocar nada.

const esquemaPiloto = z.object({ localId: esquemaId });
const esquemaEstado = z.object({ localId: esquemaId, estado: z.enum(["vencido", "cortesia"]) });

export async function activarPilotoAccion(localId: string): Promise<EstadoFormulario<AccesoEfectivo>> {
  await exigirAdmin();
  const v = esquemaPiloto.safeParse({ localId });
  if (!v.success) return { ok: false, error: "datos_invalidos", campos: erroresPorCampo(v.error) };
  const r = await activarPiloto(v.data.localId);
  if (r.ok) revalidatePath("/admin");
  return r;
}

export async function cambiarEstadoAccion(localId: string, estado: string): Promise<EstadoFormulario<AccesoEfectivo>> {
  await exigirAdmin();
  const v = esquemaEstado.safeParse({ localId, estado });
  if (!v.success) return { ok: false, error: "datos_invalidos", campos: erroresPorCampo(v.error) };
  const r = await cambiarEstadoAcceso(v.data.localId, v.data.estado);
  if (r.ok) revalidatePath("/admin");
  return r;
}
