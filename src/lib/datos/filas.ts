// Filas de la base de datos tal y como las devuelve Supabase (snake_case).
// Mientras no exista database.types.ts (lo genera el director tras aplicar la migración), estas son la
// referencia. Mismo modelo que supabase/migrations/*_modelo_v01.sql.

import type { DiaSemana } from "@/lib/tipos/dominio";

/** jsonb tal cual: se valida y convierte en mapeos.ts. */
export type Json = string | number | boolean | null | Json[] | { [clave: string]: Json };

export type FilaPerfil = {
  id: string;
  correo: string;
  nombre: string | null;
  prueba_usada_en: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type FilaLocal = {
  id: string;
  dueno_id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  logo_ruta: string | null;
  color_marca: string;
  horarios: Json;
  idioma_base: string;
  idiomas_activos: string[];
  traducciones: Json;
  publicado: boolean;
  permitir_indexar: boolean;
  creado_en: string;
  actualizado_en: string;
};

/** Lo que puede leer el rol anon de `locales` (sin dueno_id ni creado_en). */
export type FilaLocalPublica = Omit<FilaLocal, "dueno_id" | "creado_en">;

export type FilaSlugAnterior = { slug: string; local_id: string; creado_en: string };

export type FilaAcceso = {
  local_id: string;
  estado: "prueba" | "piloto" | "cortesia" | "suscripcion" | "vencido";
  plan: "carta" | "carta_resenas";
  vigente_hasta: string | null;
  notas: string | null;
  actualizado_en: string;
  actualizado_por: string | null;
};

export type FilaSeccion = {
  id: string;
  local_id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  visible: boolean;
  traducciones: Json;
  creado_en: string;
  actualizado_en: string;
};

export type FilaPlato = {
  id: string;
  local_id: string;
  seccion_id: string;
  nombre: string;
  descripcion: string | null;
  precios: Json;
  alergenos: string[];
  trazas: string[];
  alergenos_confirmados: boolean;
  etiquetas: string[];
  foto_ruta: string | null;
  orden: number;
  agotado: boolean;
  visible: boolean;
  traducciones: Json;
  creado_en: string;
  actualizado_en: string;
};

/** Contenido jsonb del menú (claves en snake_case dentro de la base de datos). */
export type ContenidoMenu = {
  grupos: Array<{
    id: string;
    titulo: string;
    items: Array<{ id: string; nombre: string; alergenos: string[]; alergenos_confirmados: boolean }>;
  }>;
};

export type FilaMenu = {
  id: string;
  local_id: string;
  nombre: string;
  precio_centimos: number | null;
  dias: DiaSemana[] | number[];
  /** Postgres `time`: "13:00:00". */
  hora_inicio: string | null;
  hora_fin: string | null;
  contenido: Json;
  notas: string | null;
  orden: number;
  visible: boolean;
  traducciones: Json;
  creado_en: string;
  actualizado_en: string;
};

// ---------------------------------------------------------------------------
// Columnas que se piden en cada consulta (las públicas son exactamente las que tiene concedidas anon).
// ---------------------------------------------------------------------------

export const COLUMNAS_LOCAL_PUBLICO =
  "id, slug, nombre, descripcion, direccion, telefono, logo_ruta, color_marca, horarios, idioma_base, idiomas_activos, traducciones, publicado, permitir_indexar, actualizado_en";
export const COLUMNAS_SECCION_PUBLICA = "id, local_id, nombre, descripcion, orden, visible, traducciones, actualizado_en";
export const COLUMNAS_PLATO_PUBLICO =
  "id, local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, foto_ruta, orden, agotado, visible, traducciones, actualizado_en";
export const COLUMNAS_MENU_PUBLICO =
  "id, local_id, nombre, precio_centimos, dias, hora_inicio, hora_fin, contenido, notas, orden, visible, traducciones, actualizado_en";
export const COLUMNAS_ACCESO = "local_id, estado, plan, vigente_hasta, notas, actualizado_en, actualizado_por";
