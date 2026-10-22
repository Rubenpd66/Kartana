import "server-only";
import { z } from "zod";
import { calcularAccesoEfectivo } from "@/lib/dominio/acceso";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { AccesoEfectivo, EstadoAcceso, FilaAdmin } from "@/lib/tipos/cuentas";
import type { Resultado } from "@/lib/tipos/resultado";
import { erroresPorCampo, esquemaId } from "@/lib/validacion/comun";
import { revalidarCartaFueraDeAccion } from "./cache";
import { idUsuario, traducirError, unoODos } from "./comun";
import { COLUMNAS_ACCESO, type FilaAcceso } from "./filas";
import { filaAAcceso } from "./mapeos";

// Administración. La RLS solo deja pasar a quien tiene app_metadata.rol = "admin"; además, la página
// y la acción comprueban exigirAdmin() (ADMIN_EMAILS). Aquí no se usa la clave secreta.

function efectivo(fila: FilaAcceso | null): AccesoEfectivo {
  const acceso = fila ? filaAAcceso(fila) : { estado: "vencido" as const, plan: "carta_resenas" as const, vigenteHasta: null };
  return calcularAccesoEfectivo(acceso, new Date());
}

/** Todos los locales con el correo del dueño, su acceso y su número de platos (visibles o no). */
export async function listarLocalesAdmin(): Promise<FilaAdmin[]> {
  const supabase = await crearClienteServidor();
  if (!(await idUsuario(supabase))) return [];
  const { data, error } = await supabase
    .from("locales")
    .select(
      `id, nombre, slug, publicado, creado_en, perfiles!locales_dueno_id_fkey(correo), accesos(${COLUMNAS_ACCESO}), platos!platos_local_id_fkey(id)`,
    )
    .order("creado_en", { ascending: false });
  if (error) throw new Error(`listarLocalesAdmin: ${error.message}`);

  const filas = (data ?? []) as unknown as Array<{
    id: string;
    nombre: string;
    slug: string;
    publicado: boolean;
    creado_en: string;
    perfiles: { correo: string } | Array<{ correo: string }> | null;
    accesos: FilaAcceso | FilaAcceso[] | null;
    platos: Array<{ id: string }> | null;
  }>;
  return filas.map((f) => ({
    localId: f.id,
    nombre: f.nombre,
    slug: f.slug,
    publicado: f.publicado,
    correoDueno: unoODos(f.perfiles)?.correo ?? "",
    creadoEn: f.creado_en,
    acceso: efectivo(unoODos(f.accesos)),
    numPlatos: (f.platos ?? []).length,
  }));
}

const esquemaPiloto = z.object({ localId: esquemaId });
const esquemaEstado = z.object({ localId: esquemaId, estado: z.enum(["vencido", "cortesia"]) });

async function llamarRpc(
  funcion: "activar_piloto" | "cambiar_estado_acceso",
  args: Record<string, string>,
  localId: string,
): Promise<Resultado<AccesoEfectivo>> {
  try {
    const supabase = await crearClienteServidor();
    if (!(await idUsuario(supabase))) return { ok: false, error: "no_autenticado" };
    const { data, error } = await supabase.rpc(funcion, args);
    if (error) return { ok: false, error: traducirError(error) };
    const fila = unoODos(data as FilaAcceso | FilaAcceso[] | null);
    // Si quien llama no es admin, la RLS no deja actualizar y la función devuelve vacío.
    if (!fila || !fila.local_id) return { ok: false, error: "sin_permiso" };
    await revalidarCartaFueraDeAccion(localId);
    return { ok: true, datos: efectivo(fila) };
  } catch (error) {
    console.error(`admin.${funcion}:`, error);
    return { ok: false, error: "error_servidor" };
  }
}

/** Piloto de 60 días (función SQL activar_piloto). La carta se vuelve a ver al momento. */
export async function activarPiloto(localId: string): Promise<Resultado<AccesoEfectivo>> {
  const validado = esquemaPiloto.safeParse({ localId });
  if (!validado.success) return { ok: false, error: "datos_invalidos", campos: erroresPorCampo(validado.error) };
  return llamarRpc("activar_piloto", { p_local: validado.data.localId }, validado.data.localId);
}

/** Solo "vencido" o "cortesia" (función SQL cambiar_estado_acceso). */
export async function cambiarEstadoAcceso(
  localId: string,
  estado: Extract<EstadoAcceso, "vencido" | "cortesia">,
): Promise<Resultado<AccesoEfectivo>> {
  const validado = esquemaEstado.safeParse({ localId, estado });
  if (!validado.success) return { ok: false, error: "datos_invalidos", campos: erroresPorCampo(validado.error) };
  return llamarRpc("cambiar_estado_acceso", { p_local: validado.data.localId, p_estado: validado.data.estado }, validado.data.localId);
}
