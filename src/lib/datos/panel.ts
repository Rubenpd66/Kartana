import "server-only";
import { calcularAccesoEfectivo } from "@/lib/dominio/acceso";
import { validarSlug } from "@/lib/dominio/slugs";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { CartaPanel, Local, LocalResumen, Menu, Plato } from "@/lib/tipos/carta";
import type { AccesoEfectivo } from "@/lib/tipos/cuentas";
import { COLUMNAS_LOCAL, COLUMNAS_MENU, COLUMNAS_PLATO, COLUMNAS_SECCION, idUsuario, unoODos, type ClienteSupabase } from "./comun";
import { COLUMNAS_ACCESO, type FilaAcceso, type FilaLocal, type FilaMenu, type FilaPlato, type FilaSeccion } from "./filas";
import { filaAAcceso, filaALocal, filaAMenu, filaAPlato, filaASeccion } from "./mapeos";

// Lecturas del panel con la sesión del dueño. Quien llame debe estar dentro de <Suspense> y haber
// comprobado al usuario. OJO: con sesión también se ven las cartas PUBLICADAS de otros (política pública),
// así que toda lectura filtra por dueno_id o comprueba antes que el local es del usuario.

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const porOrden = <T extends { orden: number }>(a: T, b: T) => a.orden - b.orden;

/** Acceso efectivo de una fila (sin fila = vencido: la carta no se ve). */
function accesoEfectivo(fila: FilaAcceso | null): AccesoEfectivo {
  if (!fila) return calcularAccesoEfectivo({ estado: "vencido", plan: "carta_resenas", vigenteHasta: null }, new Date());
  return calcularAccesoEfectivo(filaAAcceso(fila), new Date());
}

/** Sesión + cliente; null si no hay usuario. */
async function contexto(): Promise<{ supabase: ClienteSupabase; uid: string } | null> {
  const supabase = await crearClienteServidor();
  const uid = await idUsuario(supabase);
  return uid ? { supabase, uid } : null;
}

async function esLocalDe(supabase: ClienteSupabase, uid: string, localId: string): Promise<boolean> {
  const { data } = await supabase.from("locales").select("id").eq("id", localId).eq("dueno_id", uid).maybeSingle();
  return Boolean(data);
}

export async function listarMisLocales(): Promise<LocalResumen[]> {
  const ctx = await contexto();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase
    .from("locales")
    .select(`id, slug, nombre, publicado, accesos(${COLUMNAS_ACCESO})`)
    .eq("dueno_id", ctx.uid)
    .order("creado_en");
  if (error) throw new Error(`listarMisLocales: ${error.message}`);
  const filas = (data ?? []) as unknown as Array<
    Pick<FilaLocal, "id" | "slug" | "nombre" | "publicado"> & { accesos: FilaAcceso | FilaAcceso[] | null }
  >;
  return filas.map((f) => ({ id: f.id, slug: f.slug, nombre: f.nombre, publicado: f.publicado, acceso: accesoEfectivo(unoODos(f.accesos)) }));
}

export async function obtenerLocalDelDueno(localId: string): Promise<Local | null> {
  if (!ES_UUID.test(localId)) return null;
  const ctx = await contexto();
  if (!ctx) return null;
  const { data, error } = await ctx.supabase.from("locales").select(COLUMNAS_LOCAL).eq("id", localId).eq("dueno_id", ctx.uid).maybeSingle();
  if (error) throw new Error(`obtenerLocalDelDueno: ${error.message}`);
  return data ? filaALocal(data as unknown as FilaLocal) : null;
}

/** Toda la carta del local para el panel, también lo oculto, ordenada. */
export async function obtenerCartaDelDueno(localId: string): Promise<CartaPanel | null> {
  if (!ES_UUID.test(localId)) return null;
  const ctx = await contexto();
  if (!ctx) return null;
  const { data, error } = await ctx.supabase
    .from("locales")
    .select(
      `${COLUMNAS_LOCAL}, accesos(${COLUMNAS_ACCESO}), secciones(${COLUMNAS_SECCION}, platos!platos_seccion_fk(${COLUMNAS_PLATO})), menus(${COLUMNAS_MENU})`,
    )
    .eq("id", localId)
    .eq("dueno_id", ctx.uid)
    .maybeSingle();
  if (error) throw new Error(`obtenerCartaDelDueno: ${error.message}`);
  if (!data) return null;

  const fila = data as unknown as FilaLocal & {
    accesos: FilaAcceso | FilaAcceso[] | null;
    secciones: Array<FilaSeccion & { platos: FilaPlato[] | null }> | null;
    menus: FilaMenu[] | null;
  };
  return {
    local: filaALocal(fila),
    acceso: accesoEfectivo(unoODos(fila.accesos)),
    secciones: (fila.secciones ?? [])
      .map((s) => ({ ...filaASeccion(s), platos: (s.platos ?? []).map(filaAPlato).sort(porOrden) }))
      .sort(porOrden),
    menus: (fila.menus ?? []).map(filaAMenu).sort(porOrden),
  };
}

export async function obtenerPlatoDelDueno(localId: string, platoId: string): Promise<Plato | null> {
  if (!ES_UUID.test(localId) || !ES_UUID.test(platoId)) return null;
  const ctx = await contexto();
  if (!ctx || !(await esLocalDe(ctx.supabase, ctx.uid, localId))) return null;
  const { data, error } = await ctx.supabase.from("platos").select(COLUMNAS_PLATO).eq("id", platoId).eq("local_id", localId).maybeSingle();
  if (error) throw new Error(`obtenerPlatoDelDueno: ${error.message}`);
  return data ? filaAPlato(data as unknown as FilaPlato) : null;
}

export async function obtenerMenuDelDueno(localId: string, menuId: string): Promise<Menu | null> {
  if (!ES_UUID.test(localId) || !ES_UUID.test(menuId)) return null;
  const ctx = await contexto();
  if (!ctx || !(await esLocalDe(ctx.supabase, ctx.uid, localId))) return null;
  const { data, error } = await ctx.supabase.from("menus").select(COLUMNAS_MENU).eq("id", menuId).eq("local_id", localId).maybeSingle();
  if (error) throw new Error(`obtenerMenuDelDueno: ${error.message}`);
  return data ? filaAMenu(data as unknown as FilaMenu) : null;
}

/** Acceso efectivo del local (la RLS de accesos solo deja verlo al dueño y al admin). */
export async function obtenerAccesoDelLocal(localId: string): Promise<AccesoEfectivo | null> {
  if (!ES_UUID.test(localId)) return null;
  const ctx = await contexto();
  if (!ctx) return null;
  const { data, error } = await ctx.supabase.from("accesos").select(COLUMNAS_ACCESO).eq("local_id", localId).maybeSingle();
  if (error) throw new Error(`obtenerAccesoDelLocal: ${error.message}`);
  return data ? accesoEfectivo(data as unknown as FilaAcceso) : null;
}

/**
 * ¿Se puede usar este slug? Formato y reservados aquí; «ocupado» lo responde la función SQL slug_ocupado
 * (mira locales y slugs anteriores de OTROS locales, también los no publicados que la RLS no deja ver).
 */
export async function comprobarSlug(
  slug: string,
  localId?: string,
): Promise<{ disponible: true } | { disponible: false; motivo: "formato" | "reservado" | "ocupado" }> {
  const valido = validarSlug(slug);
  if (!valido.valido) return { disponible: false, motivo: valido.motivo };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("slug_ocupado", { p_slug: slug, p_local: localId && ES_UUID.test(localId) ? localId : null });
  if (error) throw new Error(`comprobarSlug: ${error.message}`);
  return data === true ? { disponible: false, motivo: "ocupado" } : { disponible: true };
}
