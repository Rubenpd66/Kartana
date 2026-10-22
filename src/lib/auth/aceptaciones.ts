import "server-only";
import { VERSIONES_LEGALES } from "@/lib/legal/documentos";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { AceptacionLegal, DocumentoAceptable } from "@/lib/tipos/cuentas";
import type { Resultado } from "@/lib/tipos/resultado";
import { obtenerUsuario } from "./sesion";

const DOCUMENTOS: DocumentoAceptable[] = ["condiciones", "privacidad"];

type FilaAceptacion = { documento: string; version: string; aceptada_en?: string };

/** true si el usuario ha aceptado las versiones vigentes (VERSIONES_LEGALES) de condiciones y privacidad. */
export async function condicionesAlDia(): Promise<boolean> {
  const usuario = await obtenerUsuario();
  if (!usuario) return false;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("aceptaciones_legales")
    .select("documento, version")
    .eq("usuario_id", usuario.id);
  if (error || !data) return false;
  const filas = data as FilaAceptacion[];
  return DOCUMENTOS.every((doc) => filas.some((f) => f.documento === doc && f.version === VERSIONES_LEGALES[doc]));
}

/** Guarda la aceptación de las versiones vigentes. La fecha la pone la base de datos. Ignora duplicados. */
export async function registrarAceptaciones(): Promise<Resultado> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, error: "no_autenticado" };
  const supabase = await crearClienteServidor();
  // Una inserción por documento: si una ya existía (23505), la otra se guarda igual.
  for (const documento of DOCUMENTOS) {
    const { error } = await supabase
      .from("aceptaciones_legales")
      .insert({ usuario_id: usuario.id, documento, version: VERSIONES_LEGALES[documento] });
    if (error && error.code !== "23505") return { ok: false, error: "error_servidor" };
  }
  return { ok: true, datos: undefined };
}

/** La aceptación más reciente de cada documento (para /panel/cuenta). */
export async function ultimasAceptaciones(): Promise<Record<DocumentoAceptable, AceptacionLegal | null>> {
  const vacio: Record<DocumentoAceptable, AceptacionLegal | null> = { condiciones: null, privacidad: null };
  const usuario = await obtenerUsuario();
  if (!usuario) return vacio;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("aceptaciones_legales")
    .select("documento, version, aceptada_en")
    .eq("usuario_id", usuario.id)
    .order("aceptada_en", { ascending: false });
  if (error || !data) return vacio;

  const resultado = { ...vacio };
  for (const fila of data as FilaAceptacion[]) {
    const doc = fila.documento as DocumentoAceptable;
    if (DOCUMENTOS.includes(doc) && !resultado[doc]) {
      resultado[doc] = { documento: doc, version: fila.version, aceptadaEn: fila.aceptada_en ?? "" };
    }
  }
  return resultado;
}
