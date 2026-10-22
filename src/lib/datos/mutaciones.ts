import "server-only";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type {
  EntradaAgotado,
  EntradaCrearLocal,
  EntradaHorarios,
  EntradaLocal,
  EntradaLogo,
  EntradaMenu,
  EntradaOrden,
  EntradaPlato,
  EntradaPublicar,
  EntradaSeccion,
  GrupoMenu,
} from "@/lib/tipos/carta";
import type { Precio, PrecioEntrada } from "@/lib/tipos/dominio";
import type { CodigoError, Resultado, ResultadoError } from "@/lib/tipos/resultado";
import { esquemaAgotado, esquemaOrden, esquemaPlato, esquemaSeccion } from "@/lib/validacion/carta";
import { erroresPorCampo, esquemaId } from "@/lib/validacion/comun";
import { esquemaCrearLocal, esquemaHorarios, esquemaLocal, esquemaLogo, esquemaPublicar } from "@/lib/validacion/local";
import { esquemaMenu } from "@/lib/validacion/menu";
import { trasGuardarCarta } from "./cache";
import { idUsuario, traducirError, type ClienteSupabase, type ErrorBD } from "./comun";
import { contenidoDeGrupos } from "./mapeos";

// Escrituras del panel. SOLO se llaman desde acciones de servidor.
// Cada función: valida con Zod, comprueba la sesión (getClaims), escribe con la sesión del usuario (RLS),
// traduce los errores de Postgres a CodigoError e invalida la caché de la carta. Nunca lanza.

const BUCKET = "imagenes";

type Contexto = { supabase: ClienteSupabase; uid: string };

const fallo = (error: CodigoError, campos?: Record<string, string>): ResultadoError =>
  campos ? { ok: false, error, campos } : { ok: false, error };

const ok = <T>(datos: T): Resultado<T> => ({ ok: true, datos });

function falloBD(error: NonNullable<ErrorBD>): ResultadoError {
  const codigo = traducirError(error);
  return codigo === "slug_ocupado" ? fallo(codigo, { slug: "ocupado" }) : fallo(codigo);
}

/**
 * Valida, abre el cliente con la sesión y ejecuta `hacer`. Envuelve todo para no lanzar nunca.
 * Datos inválidos -> datos_invalidos con campos; sin sesión -> no_autenticado; excepción -> error_servidor.
 */
async function ejecutar<E, T>(
  esquema: z.ZodType<E>,
  entrada: unknown,
  hacer: (datos: E, ctx: Contexto) => Promise<Resultado<T>>,
): Promise<Resultado<T>> {
  const validado = esquema.safeParse(entrada);
  if (!validado.success) {
    const campos = erroresPorCampo(validado.error);
    return campos.slug === "reservado" ? fallo("slug_reservado", campos) : fallo("datos_invalidos", campos);
  }
  try {
    const supabase = await crearClienteServidor();
    const uid = await idUsuario(supabase);
    if (!uid) return fallo("no_autenticado");
    return await hacer(validado.data, { supabase, uid });
  } catch (error) {
    console.error("mutaciones:", error);
    return fallo("error_servidor");
  }
}

/** Id corto para variantes, grupos e ítems: 8 caracteres [a-z0-9]. */
function nuevoIdCorto(usados: Set<string>): string {
  let id = "";
  do id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  while (usados.has(id));
  usados.add(id);
  return id;
}

function conIdsDePrecio(precios: PrecioEntrada[]): Precio[] {
  const usados = new Set(precios.flatMap((p) => (p.id ? [p.id] : [])));
  return precios.map((p) => ({ id: p.id ?? nuevoIdCorto(usados), formato: p.formato, texto: p.texto, centimos: p.centimos }));
}

function conIdsDeMenu(grupos: EntradaMenu["grupos"]): GrupoMenu[] {
  const usados = new Set(grupos.flatMap((g) => [g.id, ...g.items.map((i) => i.id)]).filter((x): x is string => Boolean(x)));
  return grupos.map((g) => ({
    id: g.id ?? nuevoIdCorto(usados),
    titulo: g.titulo,
    items: g.items.map((i) => ({ id: i.id ?? nuevoIdCorto(usados), nombre: i.nombre, alergenos: i.alergenos, alergenosConfirmados: i.alergenosConfirmados })),
  }));
}

/** Borra archivos del bucket sin hacer fallar la operación (si quedan huérfanos, se limpian a mano). */
async function borrarArchivos(supabase: ClienteSupabase, rutas: Array<string | null | undefined>) {
  const lista = rutas.filter((r): r is string => Boolean(r));
  if (lista.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(lista);
  if (error) console.error("mutaciones: no se pudieron borrar imágenes", lista, error.message);
}

/** Siguiente `orden` al final de una lista (0 si está vacía). */
async function siguienteOrden(supabase: ClienteSupabase, tabla: "secciones" | "platos" | "menus", columna: string, valor: string) {
  const { data } = await supabase.from(tabla).select("orden").eq(columna, valor).order("orden", { ascending: false }).limit(1);
  const ultimo = (data as Array<{ orden: number }> | null)?.[0]?.orden;
  return typeof ultimo === "number" ? ultimo + 1 : 0;
}

/** Actualiza una fila del local (o de un hijo) y comprueba que se cambió algo (RLS: 0 filas si no es suya). */
async function actualizar(
  supabase: ClienteSupabase,
  tabla: "locales" | "secciones" | "platos" | "menus",
  cambios: Record<string, unknown>,
  filtro: Record<string, string>,
): Promise<ResultadoError | null> {
  let consulta = supabase.from(tabla).update(cambios);
  for (const [columna, valor] of Object.entries(filtro)) consulta = consulta.eq(columna, valor);
  const { data, error } = await consulta.select("id");
  if (error) return falloBD(error);
  if (!data || (data as unknown[]).length === 0) return fallo("no_encontrado");
  return null;
}

// ---------------------------------------------------------------------------
// Local
// ---------------------------------------------------------------------------

export async function crearLocal(entrada: EntradaCrearLocal): Promise<Resultado<{ localId: string }>> {
  return ejecutar(esquemaCrearLocal, entrada, async (datos, { supabase, uid }) => {
    const { data, error } = await supabase
      .from("locales")
      .insert({ dueno_id: uid, nombre: datos.nombre, slug: datos.slug })
      .select("id")
      .single();
    if (error) return falloBD(error);
    return ok({ localId: (data as { id: string }).id });
  });
}

export async function actualizarLocal(entrada: EntradaLocal): Promise<Resultado> {
  return ejecutar(esquemaLocal, entrada, async (datos, { supabase, uid }) => {
    const { data: actual, error: errorLectura } = await supabase
      .from("locales")
      .select("slug, permitir_indexar")
      .eq("id", datos.localId)
      .eq("dueno_id", uid)
      .maybeSingle();
    if (errorLectura) return falloBD(errorLectura);
    if (!actual) return fallo("no_encontrado");
    const previo = actual as { slug: string; permitir_indexar: boolean };

    const fallido = await actualizar(
      supabase,
      "locales",
      {
        nombre: datos.nombre,
        slug: datos.slug,
        descripcion: datos.descripcion,
        direccion: datos.direccion,
        telefono: datos.telefono,
        color_marca: datos.colorMarca,
        permitir_indexar: datos.permitirIndexar,
      },
      { id: datos.localId },
    );
    if (fallido) return fallido;

    const cambiaSlug = previo.slug !== datos.slug;
    await trasGuardarCarta(datos.localId, {
      slugAnterior: cambiaSlug ? previo.slug : undefined,
      listaCartas: cambiaSlug || previo.permitir_indexar !== datos.permitirIndexar,
    });
    return ok(undefined);
  });
}

export async function guardarHorarios(entrada: EntradaHorarios): Promise<Resultado> {
  return ejecutar(esquemaHorarios, entrada, async (datos, { supabase }) => {
    const fallido = await actualizar(supabase, "locales", { horarios: datos.horarios }, { id: datos.localId });
    if (fallido) return fallido;
    await trasGuardarCarta(datos.localId);
    return ok(undefined);
  });
}

/** Guarda la ruta nueva del logo y borra del bucket el anterior (si lo había y es distinto). */
export async function guardarLogo(entrada: EntradaLogo): Promise<Resultado> {
  return ejecutar(esquemaLogo, entrada, async (datos, { supabase, uid }) => {
    const { data: actual, error: errorLectura } = await supabase
      .from("locales")
      .select("logo_ruta")
      .eq("id", datos.localId)
      .eq("dueno_id", uid)
      .maybeSingle();
    if (errorLectura) return falloBD(errorLectura);
    const anterior = (actual as { logo_ruta: string | null } | null)?.logo_ruta ?? null;

    const fallido = await actualizar(supabase, "locales", { logo_ruta: datos.logoRuta }, { id: datos.localId });
    if (fallido) return fallido;
    if (anterior && anterior !== datos.logoRuta) await borrarArchivos(supabase, [anterior]);
    await trasGuardarCarta(datos.localId);
    return ok(undefined);
  });
}

export async function publicarLocal(entrada: EntradaPublicar): Promise<Resultado> {
  return ejecutar(esquemaPublicar, entrada, async (datos, { supabase }) => {
    const fallido = await actualizar(supabase, "locales", { publicado: datos.publicado }, { id: datos.localId });
    if (fallido) return fallido;
    await trasGuardarCarta(datos.localId, { listaCartas: true });
    return ok(undefined);
  });
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

export async function guardarSeccion(entrada: EntradaSeccion): Promise<Resultado<{ seccionId: string }>> {
  return ejecutar(esquemaSeccion, entrada, async (datos, { supabase }) => {
    const campos = { nombre: datos.nombre, descripcion: datos.descripcion, visible: datos.visible };
    let seccionId = datos.seccionId;
    if (seccionId) {
      const fallido = await actualizar(supabase, "secciones", campos, { id: seccionId, local_id: datos.localId });
      if (fallido) return fallido;
    } else {
      const orden = await siguienteOrden(supabase, "secciones", "local_id", datos.localId);
      const { data, error } = await supabase
        .from("secciones")
        .insert({ local_id: datos.localId, ...campos, orden })
        .select("id")
        .single();
      if (error) return falloBD(error);
      seccionId = (data as { id: string }).id;
    }
    await trasGuardarCarta(datos.localId);
    return ok({ seccionId });
  });
}

const esquemaIdsSeccion = z.object({ localId: esquemaId, seccionId: esquemaId });

/** Borra la sección, sus platos (cascada) y las fotos de esos platos. */
export async function borrarSeccion(localId: string, seccionId: string): Promise<Resultado> {
  return ejecutar(esquemaIdsSeccion, { localId, seccionId }, async (datos, { supabase }) => {
    const { data: platos } = await supabase
      .from("platos")
      .select("foto_ruta")
      .eq("seccion_id", datos.seccionId)
      .eq("local_id", datos.localId);
    const { data, error } = await supabase
      .from("secciones")
      .delete()
      .eq("id", datos.seccionId)
      .eq("local_id", datos.localId)
      .select("id");
    if (error) return falloBD(error);
    if (!data || (data as unknown[]).length === 0) return fallo("no_encontrado");
    await borrarArchivos(supabase, ((platos ?? []) as Array<{ foto_ruta: string | null }>).map((p) => p.foto_ruta));
    await trasGuardarCarta(datos.localId);
    return ok(undefined);
  });
}

// ---------------------------------------------------------------------------
// Platos
// ---------------------------------------------------------------------------

/**
 * Crea (esNuevo) o edita un plato. Al crear usa el platoId recibido (si ya existe -> conflicto) o genera uno.
 * Asigna id a las variantes nuevas y conserva los existentes. Si cambia la foto, borra la anterior.
 */
export async function guardarPlato(entrada: EntradaPlato): Promise<Resultado<{ platoId: string }>> {
  return ejecutar(esquemaPlato, entrada, async (datos, { supabase }) => {
    const campos = {
      seccion_id: datos.seccionId,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precios: conIdsDePrecio(datos.precios),
      alergenos: datos.alergenos,
      trazas: datos.trazas,
      alergenos_confirmados: datos.alergenosConfirmados,
      etiquetas: datos.etiquetas,
      foto_ruta: datos.fotoRuta,
      visible: datos.visible,
    };

    if (datos.esNuevo) {
      const platoId = datos.platoId ?? crypto.randomUUID();
      const orden = await siguienteOrden(supabase, "platos", "seccion_id", datos.seccionId);
      const { error } = await supabase
        .from("platos")
        .insert({ id: platoId, local_id: datos.localId, ...campos, orden })
        .select("id")
        .single();
      if (error) return falloBD(error);
      await trasGuardarCarta(datos.localId);
      return ok({ platoId });
    }

    if (!datos.platoId) return fallo("datos_invalidos", { platoId: "requerido" });
    const { data: actual } = await supabase
      .from("platos")
      .select("foto_ruta")
      .eq("id", datos.platoId)
      .eq("local_id", datos.localId)
      .maybeSingle();
    const anterior = (actual as { foto_ruta: string | null } | null)?.foto_ruta ?? null;
    const fallido = await actualizar(supabase, "platos", campos, { id: datos.platoId, local_id: datos.localId });
    if (fallido) return fallido;
    if (anterior && anterior !== datos.fotoRuta) await borrarArchivos(supabase, [anterior]);
    await trasGuardarCarta(datos.localId);
    return ok({ platoId: datos.platoId });
  });
}

const esquemaIdsPlato = z.object({ localId: esquemaId, platoId: esquemaId });

/** Borra el plato y su foto. */
export async function borrarPlato(localId: string, platoId: string): Promise<Resultado> {
  return ejecutar(esquemaIdsPlato, { localId, platoId }, async (datos, { supabase }) => {
    const { data, error } = await supabase
      .from("platos")
      .delete()
      .eq("id", datos.platoId)
      .eq("local_id", datos.localId)
      .select("id, foto_ruta");
    if (error) return falloBD(error);
    const borrados = (data ?? []) as Array<{ foto_ruta: string | null }>;
    if (borrados.length === 0) return fallo("no_encontrado");
    await borrarArchivos(supabase, borrados.map((p) => p.foto_ruta));
    await trasGuardarCarta(datos.localId);
    return ok(undefined);
  });
}

export async function cambiarAgotado(entrada: EntradaAgotado): Promise<Resultado> {
  return ejecutar(esquemaAgotado, entrada, async (datos, { supabase }) => {
    const fallido = await actualizar(supabase, "platos", { agotado: datos.agotado }, { id: datos.platoId, local_id: datos.localId });
    if (fallido) return fallido;
    await trasGuardarCarta(datos.localId);
    return ok(undefined);
  });
}

/** Nuevo orden de secciones, platos (de una sección) o menús. Todo o nada (función SQL reordenar). */
export async function reordenar(entrada: EntradaOrden): Promise<Resultado> {
  return ejecutar(esquemaOrden, entrada, async (datos, { supabase }) => {
    const { error } = await supabase.rpc("reordenar", { p_tabla: datos.tabla, p_ids: datos.ids });
    if (error) return falloBD(error);
    await trasGuardarCarta(datos.localId);
    return ok(undefined);
  });
}

// ---------------------------------------------------------------------------
// Menús
// ---------------------------------------------------------------------------

export async function guardarMenu(entrada: EntradaMenu): Promise<Resultado<{ menuId: string }>> {
  return ejecutar(esquemaMenu, entrada, async (datos, { supabase }) => {
    const campos = {
      nombre: datos.nombre,
      precio_centimos: datos.precioCentimos,
      dias: datos.dias,
      hora_inicio: datos.horaInicio,
      hora_fin: datos.horaFin,
      contenido: contenidoDeGrupos(conIdsDeMenu(datos.grupos)),
      notas: datos.notas,
      visible: datos.visible,
    };
    let menuId = datos.menuId;
    if (menuId) {
      const fallido = await actualizar(supabase, "menus", campos, { id: menuId, local_id: datos.localId });
      if (fallido) return fallido;
    } else {
      const orden = await siguienteOrden(supabase, "menus", "local_id", datos.localId);
      const { data, error } = await supabase
        .from("menus")
        .insert({ local_id: datos.localId, ...campos, orden })
        .select("id")
        .single();
      if (error) return falloBD(error);
      menuId = (data as { id: string }).id;
    }
    await trasGuardarCarta(datos.localId);
    return ok({ menuId });
  });
}

const esquemaIdsMenu = z.object({ localId: esquemaId, menuId: esquemaId });

export async function borrarMenu(localId: string, menuId: string): Promise<Resultado> {
  return ejecutar(esquemaIdsMenu, { localId, menuId }, async (datos, { supabase }) => {
    const { data, error } = await supabase
      .from("menus")
      .delete()
      .eq("id", datos.menuId)
      .eq("local_id", datos.localId)
      .select("id");
    if (error) return falloBD(error);
    if (!data || (data as unknown[]).length === 0) return fallo("no_encontrado");
    await trasGuardarCarta(datos.localId);
    return ok(undefined);
  });
}
