// Reseñas en Google (v0.3). Solo tipos.
// Reglas obligatorias (docs/brief.md «Reglas de reseñas», docs/arquitectura.md §5.7):
// el botón y el QR son iguales para todos y van directos a Google; nada de preguntas previas,
// estrellas, incentivos ni guiones; Kartana nunca escribe reseñas.

/**
 * A dónde se manda al cliente para escribir la reseña. Un local tiene como mucho uno.
 * - "place_id": identificador de la ficha en Google -> https://search.google.com/local/writereview?placeid=<placeId>
 * - "enlace": enlace oficial «Pedir reseñas» del Perfil de Empresa, normalizado: https://g.page/r/<código>/review
 */
export type DestinoResena =
  | { tipo: "place_id"; placeId: string }
  | { tipo: "enlace"; enlace: string };

/** Configuración de reseñas de un local, para el panel del dueño (con sesión). */
export type ConfigResenas = {
  localId: string;
  slug: string;
  /** Botón encendido en la carta. Solo puede ser true si hay destino. */
  activas: boolean;
  destino: DestinoResena | null;
};
// D2 (decidido 23/10/2026): el nombre de la ficha de Google NO se guarda (la política de Google solo permite
// guardar el place_id). El panel enseña «Ficha de Google conectada» y un enlace para comprobarla en Maps.

/**
 * Lo que necesitan la carta pública y GET /r/[slug] (cliente público, cacheado).
 * `destino` es null si el botón está apagado.
 */
export type DestinoResenaPublico = {
  localId: string;
  /** Slug actual del local (puede diferir del pedido si era un slug antiguo). */
  slugActual: string;
  destino: DestinoResena | null;
};

/** Una sugerencia del buscador de fichas (Places Autocomplete). Nunca se guarda: solo se muestra. */
export type SugerenciaLugar = {
  placeId: string;
  /** structuredFormat.mainText.text */
  nombre: string;
  /** structuredFormat.secondaryText.text (dirección corta) o null. */
  direccion: string | null;
};

/** Ficha confirmada con Place Details (field mask `id,displayName`). */
export type FichaGoogle = {
  placeId: string;
  nombre: string;
};

/** Cuerpo JSON de GET /api/lugares. Errores con el código de CodigoError. */
export type RespuestaLugares =
  | { sugerencias: SugerenciaLugar[] }
  | { error: "servicio_apagado" | "datos_invalidos" | "no_autenticado" | "cuota_agotada" | "error_servidor" };

// ---------------------------------------------------------------------------
// Entradas (validadas con los esquemas Zod de src/lib/validacion/resenas.ts,
// declarados `satisfies z.ZodType<EntradaX>`).
// ---------------------------------------------------------------------------

/** Parámetros de GET /api/lugares. `q` 3–100 caracteres tras trim; `sesion` uuid (token de sesión de Autocomplete). */
export type EntradaBuscarLugares = {
  localId: string;
  q: string;
  sesion: string;
};

/** El dueño elige una sugerencia del buscador. */
export type EntradaElegirFicha = {
  localId: string;
  placeId: string;
  sesion: string;
};

/** El dueño pega un enlace de Google (o un place ID suelto). Máximo 500 caracteres. */
export type EntradaEnlaceManual = {
  localId: string;
  enlace: string;
};

/** Lo que guarda guardarFichaGoogle (lo construyen las acciones del carril resenas). */
export type EntradaFichaGoogle = {
  localId: string;
  destino: DestinoResena;
  /** Encender el botón a la vez (por defecto en la interfaz: sí). */
  activar: boolean;
};

export type EntradaResenasActivas = {
  localId: string;
  activas: boolean;
};

// ---------------------------------------------------------------------------
// Límites y formatos
// ---------------------------------------------------------------------------

/** src/lib/dominio/resenas.ts -> `export const LIMITES_RESENAS` (mismos números que los CHECK y las funciones SQL). */
export type LimitesResenas = {
  enlaceManual: number; // 500 (lo que se acepta pegar antes de interpretarlo)
  busquedaMin: number; // 3
  busquedaMax: number; // 100
  sugerencias: number; // 5
  peticionesLugaresDia: number; // 50 por local
  peticionesLugaresMes: number; // 4000 entre todos los locales
};

/** Formatos del PDF de reseña (carril qr-resena). */
export type FormatoQrResena = "tarjetas" | "tiras" | "cartel";

/** Qué QR se descarga en /panel/[local]/qr/pdf y /svg: el de la carta (por defecto) o el de reseña. */
export type TipoQr = "carta" | "resena";
