import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { LocalResumen } from "@/lib/tipos/carta";
import type { AccesoEfectivo, EstadoAcceso, Plan } from "@/lib/tipos/cuentas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIA_MS = 86_400_000;

type FilaAcceso = { estado: EstadoAcceso; plan: Plan; vigente_hasta: string | null };
type FilaLocal = {
  id: string;
  slug: string;
  nombre: string;
  publicado: boolean;
  accesos: FilaAcceso | FilaAcceso[] | null;
};

/**
 * Acceso «ahora» con la misma regla que privado.local_con_acceso():
 * estado distinto de "vencido" y (vigente_hasta null o en el futuro).
 * PROVISIONAL: en la integración se sustituye por calcularAccesoEfectivo() del carril datos.
 */
export function calcularAccesoLocal(fila: FilaAcceso | null, ahora: Date): AccesoEfectivo {
  if (!fila) return { estado: "vencido", plan: "carta", activo: false, diasRestantes: null, vigenteHasta: null };
  const fin = fila.vigente_hasta ? new Date(fila.vigente_hasta).getTime() : null;
  return {
    estado: fila.estado,
    plan: fila.plan,
    activo: fila.estado !== "vencido" && (fin === null || fin > ahora.getTime()),
    diasRestantes: fin === null ? null : Math.max(0, Math.ceil((fin - ahora.getTime()) / DIA_MS)),
    vigenteHasta: fila.vigente_hasta,
  };
}

/**
 * El local `localId` del usuario con sesión, o notFound() si no existe o no es suyo.
 * Una sola consulta por petición (React.cache): layout y página la comparten. Dentro de <Suspense>.
 */
export const obtenerLocalActual = cache(async (localId: string): Promise<LocalResumen> => {
  if (!UUID.test(localId)) notFound();
  const usuario = await exigirUsuario(`/panel/${localId}`);
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("locales")
    .select("id, slug, nombre, publicado, accesos(estado, plan, vigente_hasta)")
    .eq("id", localId)
    // El admin puede leer todos los locales por RLS: en el panel solo cuenta el suyo.
    .eq("dueno_id", usuario.id)
    .maybeSingle();
  if (error || !data) notFound();

  const fila = data as FilaLocal;
  const acceso = Array.isArray(fila.accesos) ? (fila.accesos[0] ?? null) : fila.accesos;
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    publicado: fila.publicado,
    acceso: calcularAccesoLocal(acceso, new Date()),
  };
});
