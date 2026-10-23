// Lógica pura del panel de idiomas: agrupa los textos por sección/plato/menú y decide qué enseñar.

import { esTraducible, estadoCampo } from "@/lib/traduccion/estado";
import type { IdiomaDestino, TablaTraducible } from "@/lib/tipos/dominio";
import type { EstadoCampoTraduccion, TextoTraducible } from "@/lib/tipos/traduccion";

export { estadoCampo };

export type CampoAgrupado = {
  texto: TextoTraducible;
  estado: EstadoCampoTraduccion;
};

export type GrupoTextos = {
  /** Clave estable: «tabla:filaId». */
  clave: string;
  tabla: TablaTraducible;
  filaId: string;
  /** Nombre original (en español) de la sección, plato o menú; null en el local. */
  titulo: string | null;
  campos: CampoAgrupado[];
};

/** ¿Hay algo que mirar? Falta, o está desactualizado. */
export function necesitaAtencion(estado: EstadoCampoTraduccion): boolean {
  return estado !== "al_dia_auto" && estado !== "al_dia_manual";
}

/**
 * Agrupa por fila conservando el orden de entrada (local, secciones con sus platos, menús).
 * Descarta textos vacíos. Con `soloPendientes` deja solo lo que falta o hay que revisar.
 */
export function agruparTextos(
  textos: readonly TextoTraducible[],
  idioma: IdiomaDestino,
  soloPendientes = false,
): GrupoTextos[] {
  const grupos = new Map<string, GrupoTextos>();
  for (const texto of textos) {
    if (!esTraducible(texto)) continue;
    const clave = `${texto.tabla}:${texto.filaId}`;
    let grupo = grupos.get(clave);
    if (!grupo) {
      grupo = { clave, tabla: texto.tabla, filaId: texto.filaId, titulo: null, campos: [] };
      grupos.set(clave, grupo);
    }
    if (texto.campo === "nombre" && texto.tabla !== "locales") grupo.titulo = texto.original;
    grupo.campos.push({ texto, estado: estadoCampo(texto, idioma) });
  }
  const lista = [...grupos.values()];
  if (!soloPendientes) return lista;
  return lista
    .map((g) => ({ ...g, campos: g.campos.filter((c) => necesitaAtencion(c.estado)) }))
    .filter((g) => g.campos.length > 0);
}

/** Tipo de un campo, para elegir su rótulo en el diccionario. */
export type TipoCampo = "nombre" | "descripcion" | "notas" | "precio" | "grupo" | "item";

export function tipoDeCampo(campo: string): TipoCampo {
  if (campo.startsWith("precio.")) return "precio";
  if (campo.startsWith("grupo.")) return "grupo";
  if (campo.startsWith("item.")) return "item";
  if (campo === "descripcion" || campo === "notas") return campo;
  return "nombre";
}
