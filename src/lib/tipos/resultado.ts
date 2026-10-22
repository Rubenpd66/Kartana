// Resultado común de las acciones de servidor y de las mutaciones de datos. Solo tipos.

/**
 * Códigos de error estables. La interfaz los traduce con el diccionario del módulo;
 * nunca se muestra al usuario el mensaje técnico de Supabase o de Zod.
 */
export type CodigoError =
  | "no_autenticado"
  | "sin_permiso"
  | "datos_invalidos"
  | "no_encontrado"
  | "limite_alcanzado"
  | "slug_ocupado"
  | "slug_reservado"
  | "conflicto"
  | "servicio_apagado"
  | "cuota_agotada"
  | "error_servidor";

export type ResultadoOk<T> = { ok: true; datos: T };

export type ResultadoError = {
  ok: false;
  error: CodigoError;
  /** Errores por campo del formulario: nombre del campo -> código corto (p. ej. "requerido", "demasiado_largo"). */
  campos?: Record<string, string>;
};

export type Resultado<T = void> = ResultadoOk<T> | ResultadoError;

/**
 * Estado de un formulario con useActionState: null antes del primer envío.
 * Las acciones de servidor de los módulos devuelven este tipo.
 */
export type EstadoFormulario<T = void> = Resultado<T> | null;
