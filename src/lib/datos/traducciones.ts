import "server-only";
import { z } from "zod";
import { calcularHuella } from "@/lib/dominio/huella";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type {
  ActualizarIdiomasActivos,
  ConsumirCuotaTraduccion,
  DescartarTraduccionManual,
  GuardarTraduccionesAuto,
  GuardarTraduccionManual,
  ListarTextosTraducibles,
} from "@/lib/tipos/contratos";
import type { IdiomaDestino, TablaTraducible, TextoTraducido } from "@/lib/tipos/dominio";
import type { CodigoError, ResultadoError } from "@/lib/tipos/resultado";
import type { TextoTraducible } from "@/lib/tipos/traduccion";
import { erroresPorCampo, esquemaId } from "@/lib/validacion/comun";
import {
  campoTraducibleValido,
  esquemaDescartarTraduccion,
  esquemaIdiomas,
  esquemaTraduccionManual,
  IDIOMAS_DESTINO,
  TABLAS_TRADUCIBLES,
  TEXTO_TRADUCIDO_MAX,
} from "@/lib/validacion/idiomas";
import { revalidarCartaFueraDeAccion, trasGuardarCarta } from "./cache";
import { idUsuario, traducirError, type ClienteSupabase } from "./comun";
import type { Json } from "./filas";
import { gruposDeContenido, preciosDeFila } from "./mapeos";

// Traducciones de la carta (v0.2, docs/arquitectura.md §3.4). Lee y escribe con la sesión del dueño (RLS).
// Regla de oro: una traducción «manual» nunca se pisa de forma automática (lo garantiza la función SQL
// guardar_traducciones_auto; aquí, además, el lote automático se envía sin origen).

/** Elementos por llamada a guardar_traducciones_auto (el máximo que acepta la función SQL). */
const TROZO_LOTE = 500;

const fallo = (error: CodigoError, campos?: Record<string, string>): ResultadoError =>
  campos ? { ok: false, error, campos } : { ok: false, error };

type Objeto = { [clave: string]: Json };
const esObjeto = (v: unknown): v is Objeto => typeof v === "object" && v !== null && !Array.isArray(v);

/** Contexto con sesión o null. */
async function contexto(): Promise<{ supabase: ClienteSupabase; uid: string } | null> {
  const supabase = await crearClienteServidor();
  const uid = await idUsuario(supabase);
  return uid ? { supabase, uid } : null;
}

// ---------------------------------------------------------------------------
// Campos traducibles de cada fila
// ---------------------------------------------------------------------------

/** Columnas que hacen falta para sacar los textos traducibles de cada tabla. */
const COLUMNAS: Record<TablaTraducible, string> = {
  locales: "id, descripcion, traducciones",
  secciones: "id, local_id, nombre, descripcion, orden, traducciones",
  platos: "id, local_id, nombre, descripcion, precios, orden, traducciones",
  menus: "id, local_id, nombre, notas, contenido, orden, traducciones",
};

type FilaTraducible = { id: string; traducciones: Json; [columna: string]: Json };

/** Textos originales no vacíos de una fila, con su campo («nombre», «precio.<id>.texto», «item.<id>.nombre»…). */
function textosDeFila(tabla: TablaTraducible, fila: FilaTraducible): Array<{ campo: string; original: string }> {
  const texto = (v: Json | undefined) => (typeof v === "string" ? v : null);
  const lista: Array<{ campo: string; original: string | null }> = [];
  if (tabla === "locales") {
    lista.push({ campo: "descripcion", original: texto(fila.descripcion) });
  } else if (tabla === "secciones") {
    lista.push({ campo: "nombre", original: texto(fila.nombre) }, { campo: "descripcion", original: texto(fila.descripcion) });
  } else if (tabla === "platos") {
    lista.push({ campo: "nombre", original: texto(fila.nombre) }, { campo: "descripcion", original: texto(fila.descripcion) });
    for (const p of preciosDeFila(fila.precios)) {
      if (p.formato === "otro") lista.push({ campo: `precio.${p.id}.texto`, original: p.texto });
    }
  } else {
    lista.push({ campo: "nombre", original: texto(fila.nombre) }, { campo: "notas", original: texto(fila.notas) });
    for (const g of gruposDeContenido(fila.contenido)) {
      lista.push({ campo: `grupo.${g.id}.titulo`, original: g.titulo });
      for (const i of g.items) lista.push({ campo: `item.${i.id}.nombre`, original: i.nombre });
    }
  }
  return lista.flatMap((t) =>
    t.original !== null && t.original.trim() !== "" && campoTraducibleValido(tabla, t.campo)
      ? [{ campo: t.campo, original: t.original }]
      : [],
  );
}

function esTextoTraducido(v: unknown): v is TextoTraducido {
  return (
    esObjeto(v) &&
    typeof v.texto === "string" &&
    (v.origen === "auto" || v.origen === "manual") &&
    typeof v.huella === "string" &&
    typeof v.fecha === "string"
  );
}

/** Traducciones válidas de un campo, por idioma de destino (se descarta lo que no tenga la forma esperada). */
function traduccionesDeCampo(traducciones: Json, campo: string): Partial<Record<IdiomaDestino, TextoTraducido>> {
  const resultado: Partial<Record<IdiomaDestino, TextoTraducido>> = {};
  if (!esObjeto(traducciones)) return resultado;
  for (const idioma of IDIOMAS_DESTINO) {
    const porIdioma = traducciones[idioma];
    const valor = esObjeto(porIdioma) ? porIdioma[campo] : undefined;
    if (esTextoTraducido(valor)) {
      resultado[idioma] = { texto: valor.texto, origen: valor.origen, huella: valor.huella, fecha: valor.fecha };
    }
  }
  return resultado;
}

async function textosTraducibles(tabla: TablaTraducible, fila: FilaTraducible): Promise<TextoTraducible[]> {
  return Promise.all(
    textosDeFila(tabla, fila).map(async ({ campo, original }) => ({
      tabla,
      filaId: fila.id,
      campo,
      original,
      huellaActual: await calcularHuella(original),
      traducciones: traduccionesDeCampo(fila.traducciones, campo),
    })),
  );
}

const porOrden = (a: FilaTraducible, b: FilaTraducible) => Number(a.orden ?? 0) - Number(b.orden ?? 0);

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

type FilaLocalTraducible = FilaTraducible & {
  secciones: Array<FilaTraducible & { platos: FilaTraducible[] | null }> | null;
  menus: FilaTraducible[] | null;
};

/**
 * Todos los textos traducibles del local, en el orden de la carta: descripción del local; cada sección y sus
 * platos (con los textos libres de las variantes «otro»); los menús con sus grupos e ítems.
 * Sin sesión o si el local no es tuyo: lista vacía.
 */
export const listarTextosTraducibles: ListarTextosTraducibles = async (localId) => {
  if (!esquemaId.safeParse(localId).success) return [];
  const ctx = await contexto();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase
    .from("locales")
    .select(
      `${COLUMNAS.locales}, secciones(${COLUMNAS.secciones}, platos!platos_seccion_fk(${COLUMNAS.platos})), menus(${COLUMNAS.menus})`,
    )
    .eq("id", localId)
    .eq("dueno_id", ctx.uid)
    .maybeSingle();
  if (error) throw new Error(`listarTextosTraducibles: ${error.message}`);
  if (!data) return [];

  const fila = data as unknown as FilaLocalTraducible;
  const grupos: Array<Promise<TextoTraducible[]>> = [textosTraducibles("locales", fila)];
  for (const s of [...(fila.secciones ?? [])].sort(porOrden)) {
    grupos.push(textosTraducibles("secciones", s));
    for (const p of [...(s.platos ?? [])].sort(porOrden)) grupos.push(textosTraducibles("platos", p));
  }
  for (const m of [...(fila.menus ?? [])].sort(porOrden)) grupos.push(textosTraducibles("menus", m));
  return (await Promise.all(grupos)).flat();
};

/** Fila de `tabla` que pertenece al local (en «locales», el propio local), o null. */
async function filaDelLocal(
  supabase: ClienteSupabase,
  tabla: TablaTraducible,
  filaId: string,
  localId: string,
): Promise<FilaTraducible | null> {
  if (tabla === "locales" && filaId !== localId) return null;
  const consulta = supabase.from(tabla).select(COLUMNAS[tabla]).eq("id", filaId);
  const { data, error } = await (tabla === "locales" ? consulta : consulta.eq("local_id", localId)).maybeSingle();
  if (error) throw new Error(`filaDelLocal: ${error.message}`);
  return (data as unknown as FilaTraducible | null) ?? null;
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

const esquemaLoteAuto = z.object({
  localId: esquemaId,
  lote: z.array(
    z
      .object({
        tabla: z.enum(TABLAS_TRADUCIBLES),
        filaId: esquemaId,
        idioma: z.enum(IDIOMAS_DESTINO as [IdiomaDestino, ...IdiomaDestino[]]),
        campo: z.string(),
        texto: z.string().trim().min(1).max(TEXTO_TRADUCIDO_MAX),
        huella: z.string().regex(/^[0-9a-f]{16}$/),
      })
      .refine((t) => campoTraducibleValido(t.tabla, t.campo), { message: "formato", path: ["campo"] }),
  ),
});

/**
 * Guarda traducciones automáticas (de Google) con la función SQL guardar_traducciones_auto: fusiona campo a
 * campo y NUNCA pisa una «manual». Suele correr en segundo plano (after()), así que invalida la caché con
 * revalidarCartaFueraDeAccion.
 */
export const guardarTraduccionesAuto: GuardarTraduccionesAuto = async (localId, lote) => {
  const validado = esquemaLoteAuto.safeParse({ localId, lote });
  if (!validado.success) return fallo("datos_invalidos", erroresPorCampo(validado.error));
  if (validado.data.lote.length === 0) return { ok: true, datos: { guardadas: 0 } };
  try {
    const ctx = await contexto();
    if (!ctx) return fallo("no_autenticado");

    let guardadas = 0;
    for (const tabla of TABLAS_TRADUCIBLES) {
      const deTabla = validado.data.lote
        .filter((t) => t.tabla === tabla)
        .map((t) => ({ fila_id: t.filaId, idioma: t.idioma, campo: t.campo, texto: t.texto, huella: t.huella }));
      for (let i = 0; i < deTabla.length; i += TROZO_LOTE) {
        const { data, error } = await ctx.supabase.rpc("guardar_traducciones_auto", {
          p_tabla: tabla,
          p_lote: deTabla.slice(i, i + TROZO_LOTE),
        });
        if (error) return fallo(traducirError(error));
        guardadas += typeof data === "number" ? data : 0;
      }
    }
    if (guardadas > 0) await revalidarCartaFueraDeAccion(validado.data.localId);
    return { ok: true, datos: { guardadas } };
  } catch (error) {
    console.error("guardarTraduccionesAuto:", error);
    return fallo("error_servidor");
  }
};

/** Guarda la corrección del dueño (origen «manual») con la huella del original actual. Desde acciones de servidor. */
export const guardarTraduccionManual: GuardarTraduccionManual = async (entrada) => {
  const validado = esquemaTraduccionManual.safeParse(entrada);
  if (!validado.success) return fallo("datos_invalidos", erroresPorCampo(validado.error));
  const { localId, tabla, filaId, campo, idioma, texto } = validado.data;
  try {
    const ctx = await contexto();
    if (!ctx) return fallo("no_autenticado");
    const fila = await filaDelLocal(ctx.supabase, tabla, filaId, localId);
    const original = fila ? textosDeFila(tabla, fila).find((t) => t.campo === campo)?.original : undefined;
    if (original === undefined) return fallo("no_encontrado");

    const { data, error } = await ctx.supabase.rpc("guardar_traduccion_manual", {
      p_tabla: tabla,
      p_fila: filaId,
      p_idioma: idioma,
      p_campo: campo,
      p_texto: texto,
      p_huella: await calcularHuella(original),
    });
    if (error) return fallo(traducirError(error));
    if (data !== true) return fallo("no_encontrado");
    await trasGuardarCarta(localId);
    return { ok: true, datos: undefined };
  } catch (error) {
    console.error("guardarTraduccionManual:", error);
    return fallo("error_servidor");
  }
};

/** Quita la corrección manual de un campo: la próxima traducción automática lo rellenará. Desde acciones. */
export const descartarTraduccionManual: DescartarTraduccionManual = async (entrada) => {
  const validado = esquemaDescartarTraduccion.safeParse(entrada);
  if (!validado.success) return fallo("datos_invalidos", erroresPorCampo(validado.error));
  const { localId, tabla, filaId, campo, idioma } = validado.data;
  try {
    const ctx = await contexto();
    if (!ctx) return fallo("no_autenticado");
    if (!(await filaDelLocal(ctx.supabase, tabla, filaId, localId))) return fallo("no_encontrado");

    const { data, error } = await ctx.supabase.rpc("descartar_traduccion_manual", {
      p_tabla: tabla,
      p_fila: filaId,
      p_idioma: idioma,
      p_campo: campo,
    });
    if (error) return fallo(traducirError(error));
    if (data !== true) return fallo("no_encontrado");
    await trasGuardarCarta(localId);
    return { ok: true, datos: undefined };
  } catch (error) {
    console.error("descartarTraduccionManual:", error);
    return fallo("error_servidor");
  }
};

/** Idiomas en los que se ve la carta (siempre con «es»). Cambia el sitemap: invalida también la lista. */
export const actualizarIdiomasActivos: ActualizarIdiomasActivos = async (entrada) => {
  const validado = esquemaIdiomas.safeParse(entrada);
  if (!validado.success) return fallo("datos_invalidos", erroresPorCampo(validado.error));
  try {
    const ctx = await contexto();
    if (!ctx) return fallo("no_autenticado");
    const { data, error } = await ctx.supabase
      .from("locales")
      .update({ idiomas_activos: validado.data.idiomas })
      .eq("id", validado.data.localId)
      .eq("dueno_id", ctx.uid)
      .select("id");
    if (error) return fallo(traducirError(error));
    if (!data || (data as unknown[]).length === 0) return fallo("no_encontrado");
    await trasGuardarCarta(validado.data.localId, { listaCartas: true });
    return { ok: true, datos: undefined };
  } catch (error) {
    console.error("actualizarIdiomasActivos:", error);
    return fallo("error_servidor");
  }
};

/**
 * Reserva `caracteres` de la cuota (60.000/día por local y 450.000/mes en total, en SQL con bloqueo).
 * false si no queda cuota, si no eres el dueño o ante cualquier error (mejor no traducir que pasarse).
 */
export const consumirCuotaTraduccion: ConsumirCuotaTraduccion = async (localId, caracteres) => {
  if (!esquemaId.safeParse(localId).success || !Number.isInteger(caracteres) || caracteres < 0) return false;
  if (caracteres === 0) return true;
  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("consumir_cuota_traduccion", { p_local: localId, p_caracteres: caracteres });
    if (error) {
      console.error("consumirCuotaTraduccion:", error.message);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("consumirCuotaTraduccion:", error);
    return false;
  }
};
