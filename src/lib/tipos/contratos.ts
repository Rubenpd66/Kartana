// Firmas de lo que cada módulo ofrece a los demás. Solo tipos: la implementación la
// escribe el carril dueño del archivo indicado en cada bloque (ver docs/propiedad.md).
// Regla: el carril que implementa exporta EXACTAMENTE estos nombres con estas firmas,
// y puede comprobarlo con `export const x: Firma = ...` o `satisfies`.
// Cambiar una firma = cambio compartido: se pide en el informe final, no se hace.

import type { ReactNode } from "react";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type {
  CartaIndexable,
  CartaPanel,
  CartaPublica,
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
  Local,
  LocalResumen,
  Menu,
  Plato,
} from "./carta";
import type { AccesoEfectivo, Acceso, EstadoAcceso, FilaAdmin, Usuario } from "./cuentas";
import type {
  CodigoAlergeno,
  CodigoEtiqueta,
  FormatoPrecio,
  FranjaHoraria,
  IdiomaDestino,
  TablaTraducible,
  Traducciones,
} from "./dominio";
import type { DiccionarioCarta } from "./i18n";
import type { Resultado } from "./resultado";
import type { EventoEstadistica, ResumenEstadisticas } from "./estadisticas";
import type {
  Pendiente,
  ResultadoTraducirLocal,
  ResumenTraduccion,
  TextoTraducible,
  TraduccionAGuardar,
} from "./traduccion";

// ===========================================================================
// CARRIL datos · src/lib/dominio/*  (lógica pura, sin red; usable en servidor y navegador)
// ===========================================================================

/** src/lib/dominio/alergenos.ts -> `export const ALERGENOS` (los 14, en el orden del anexo II). */
export type ListaAlergenos = readonly CodigoAlergeno[];
/** src/lib/dominio/etiquetas.ts -> `export const ETIQUETAS`. */
export type ListaEtiquetas = readonly CodigoEtiqueta[];
/** src/lib/dominio/precios.ts -> `export const FORMATOS_PRECIO`. */
export type ListaFormatos = readonly FormatoPrecio[];

/** src/lib/dominio/limites.ts -> `export const LIMITES` (los mismos números que los CHECK de SQL). */
export type Limites = {
  nombreLocal: number; // 80
  descripcionLocal: number; // 300
  direccion: number; // 200
  telefono: number; // 30
  nombreSeccion: number; // 60
  descripcionSeccion: number; // 200
  nombrePlato: number; // 80
  descripcionPlato: number; // 300
  preciosPorPlato: number; // 6 (mínimo 1)
  textoFormatoLibre: number; // 30
  centimosMax: number; // 100000
  seccionesPorLocal: number; // 40
  platosPorLocal: number; // 400
  menusPorLocal: number; // 10
  gruposPorMenu: number; // 6
  itemsPorGrupo: number; // 12
  franjasPorDia: number; // 3
  slugMin: number; // 3
  slugMax: number; // 40
  localesPorUsuario: number; // 1 en v0.1
  bytesImagen: number; // 2 * 1024 * 1024
};

/** src/lib/dominio/slugs.ts */
export type SlugsReservados = readonly string[]; // `export const SLUGS_RESERVADOS`
// `export const SLUG_DEMO = "demo"`: la carta de demostración (reservado para usuarios; lo crea la semilla).
export type NormalizarSlug = (texto: string) => string; // `export function normalizarSlug` ("Bar Pepe's" -> "bar-pepes")
export type ValidarSlug = (slug: string) => { valido: true } | { valido: false; motivo: "formato" | "reservado" };

/** src/lib/dominio/precios.ts -> `export function formatearPrecio` ("12,50 €" en es-ES; usa Intl con el locale del diccionario). */
export type FormatearPrecio = (centimos: number, locale: string) => string;

/** src/lib/dominio/contraste.ts */
export type RatioContraste = (colorA: string, colorB: string) => number; // `export function ratioContraste` (WCAG 2.x)
export type ColorMarcaValido = (color: string) => boolean; // `export function colorMarcaValido`: "#rrggbb" y ratio >= 4.5 con #ffffff
export type ColorTextoSobre = (fondo: string) => "#ffffff" | "#1f1a17"; // `export function colorTextoSobre`

/** src/lib/dominio/horarios.ts -> `export function resumirHorarios`: agrupa días con las mismas franjas («L–V 13:00–16:00»). */
export type ResumirHorarios = (
  horarios: FranjaHoraria[],
  diccionario: Pick<DiccionarioCarta, "diasCortos" | "textos">,
) => Array<{ dias: string; franjas: string }>;

/**
 * src/lib/dominio/traducir.ts -> `export function elegirTexto`.
 * Devuelve el texto en `idioma` si existe traducción; si no, el original.
 * `esOriginal` = true cuando se devolvió el original en un idioma distinto de "es" (para marcar lang="es").
 */
export type ElegirTexto = <C extends string>(
  original: string,
  traducciones: Traducciones<C>,
  campo: C,
  idioma: IdiomaCarta,
) => { texto: string; esOriginal: boolean };

/** src/lib/dominio/acceso.ts -> `export function calcularAccesoEfectivo` (mismo criterio que privado.local_con_acceso en SQL). */
export type CalcularAccesoEfectivo = (acceso: Pick<Acceso, "estado" | "plan" | "vigenteHasta">, ahora: Date) => AccesoEfectivo;

/** src/lib/dominio/carta.ts -> `export function convertirACartaPublica` (para la vista previa del panel; filtra lo oculto). */
export type ConvertirACartaPublica = (carta: CartaPanel, urlPublica: (ruta: string) => string) => CartaPublica;

/** src/lib/dominio/imagenes.ts */
export type UrlPublicaImagen = (ruta: string) => string; // `export function urlPublicaImagen` (NEXT_PUBLIC_SUPABASE_URL + /storage/v1/object/public/imagenes/ + ruta)
export type RutaNuevoLogo = (localId: string) => string; // `export function rutaNuevoLogo` -> "<localId>/logo/<aleatorio>.png"
export type RutaNuevaFotoPlato = (localId: string, platoId: string) => string; // `export function rutaNuevaFotoPlato` -> "<localId>/platos/<platoId>/<aleatorio>.webp"

// ===========================================================================
// CARRIL datos · src/lib/datos/*  (acceso a Supabase; SOLO servidor: `import "server-only"`)
// ===========================================================================

/**
 * src/lib/datos/publico.ts  (crearClientePublico, sin cookies, dentro de 'use cache')
 * - cacheTag(etiquetaCarta(slug)) siempre; además cacheTag(etiquetaLocal(id)) si existe.
 * - cacheLife("hours").
 * - Devuelve null si no existe, no está publicado o no tiene acceso activo (lo decide la RLS).
 */
export type ObtenerCartaPublica = (slug: string) => Promise<CartaPublica | null>; // `obtenerCartaPublica`
/** Si `slug` es un slug antiguo de un local visible, devuelve el slug actual (para redirigir 308). Cacheado con etiquetaCarta(slug). */
export type BuscarSlugActual = (slugAnterior: string) => Promise<string | null>; // `buscarSlugActual`
/** Cartas indexables para el sitemap. Cacheado con la etiqueta ETIQUETA_LISTA_CARTAS. */
export type ListarCartasIndexables = () => Promise<CartaIndexable[]>; // `listarCartasIndexables`

/**
 * src/lib/datos/panel.ts  (crearClienteServidor, con la sesión; la RLS limita al dueño)
 * Quien lo llame debe estar dentro de <Suspense> y haber comprobado al usuario.
 */
export type ListarMisLocales = () => Promise<LocalResumen[]>; // `listarMisLocales`
export type ObtenerCartaDelDueno = (localId: string) => Promise<CartaPanel | null>; // `obtenerCartaDelDueno`
export type ObtenerLocalDelDueno = (localId: string) => Promise<Local | null>; // `obtenerLocalDelDueno`
export type ObtenerPlatoDelDueno = (localId: string, platoId: string) => Promise<Plato | null>; // `obtenerPlatoDelDueno`
export type ObtenerMenuDelDueno = (localId: string, menuId: string) => Promise<Menu | null>; // `obtenerMenuDelDueno`
export type ObtenerAccesoDelLocal = (localId: string) => Promise<AccesoEfectivo | null>; // `obtenerAccesoDelLocal`
export type ComprobarSlug = (
  slug: string,
  localId?: string,
) => Promise<{ disponible: true } | { disponible: false; motivo: "formato" | "reservado" | "ocupado" }>; // `comprobarSlug`

/**
 * src/lib/datos/mutaciones.ts  — SOLO se llaman desde acciones de servidor.
 * Cada función: valida con Zod (src/lib/validacion/*), comprueba la sesión (getClaims),
 * escribe con crearClienteServidor (RLS) y, si cambia lo público, llama a trasGuardarCarta().
 * Nunca lanza por errores esperados: devuelve Resultado con un CodigoError.
 */
export type CrearLocal = (entrada: EntradaCrearLocal) => Promise<Resultado<{ localId: string }>>; // `crearLocal`
export type ActualizarLocal = (entrada: EntradaLocal) => Promise<Resultado>; // `actualizarLocal`
export type GuardarHorarios = (entrada: EntradaHorarios) => Promise<Resultado>; // `guardarHorarios`
/** Guarda la ruta nueva y borra del bucket el logo anterior (si lo había). */
export type GuardarLogo = (entrada: EntradaLogo) => Promise<Resultado>; // `guardarLogo`
export type PublicarLocal = (entrada: EntradaPublicar) => Promise<Resultado>; // `publicarLocal`
export type GuardarSeccion = (entrada: EntradaSeccion) => Promise<Resultado<{ seccionId: string }>>; // `guardarSeccion`
/** Borra la sección, sus platos (cascada) y las fotos de esos platos en el bucket. */
export type BorrarSeccion = (localId: string, seccionId: string) => Promise<Resultado>; // `borrarSeccion`
/** Si cambia la foto, borra la anterior del bucket. */
export type GuardarPlato = (entrada: EntradaPlato) => Promise<Resultado<{ platoId: string }>>; // `guardarPlato`
export type BorrarPlato = (localId: string, platoId: string) => Promise<Resultado>; // `borrarPlato`
export type CambiarAgotado = (entrada: EntradaAgotado) => Promise<Resultado>; // `cambiarAgotado`
export type Reordenar = (entrada: EntradaOrden) => Promise<Resultado>; // `reordenar`
export type GuardarMenu = (entrada: EntradaMenu) => Promise<Resultado<{ menuId: string }>>; // `guardarMenu`
export type BorrarMenu = (localId: string, menuId: string) => Promise<Resultado>; // `borrarMenu`

/**
 * src/lib/datos/admin.ts  — la RLS solo deja pasar a quien tiene app_metadata.rol = "admin";
 * además la acción comprueba exigirAdmin() (ADMIN_EMAILS).
 */
export type ListarLocalesAdmin = () => Promise<FilaAdmin[]>; // `listarLocalesAdmin`
/** Pone estado "piloto" y vigente_hasta = now() + 60 días (función SQL activar_piloto). */
export type ActivarPiloto = (localId: string) => Promise<Resultado<AccesoEfectivo>>; // `activarPiloto`
export type CambiarEstadoAcceso = (
  localId: string,
  estado: Extract<EstadoAcceso, "vencido" | "cortesia">,
) => Promise<Resultado<AccesoEfectivo>>; // `cambiarEstadoAcceso`

/** src/lib/datos/cache.ts */
export type EtiquetaCarta = (slug: string) => string; // `etiquetaCarta` -> "carta:<slug>"
export type EtiquetaLocal = (localId: string) => string; // `etiquetaLocal` -> "local:<id>"
// `export const ETIQUETA_LISTA_CARTAS = "cartas"`
/**
 * `trasGuardarCarta`: invalida al momento (updateTag) la carta pública del local.
 * Solo dentro de acciones de servidor. Si el slug cambió, pasar también el anterior.
 * En la v0.2 este archivo pasa al carril traduccion, que añade la traducción en segundo plano.
 */
export type TrasGuardarCarta = (localId: string, opciones?: { slugAnterior?: string; listaCartas?: boolean }) => Promise<void>;
/** `revalidarCartaFueraDeAccion`: lo mismo con revalidateTag(tag, { expire: 0 }) para route handlers y after(). */
export type RevalidarCartaFueraDeAccion = (localId: string) => Promise<void>;

// ===========================================================================
// CARRIL acceso · src/lib/auth/*, src/lib/panel/*, src/lib/imagenes/*, src/componentes/ui/*
// ===========================================================================

/** src/lib/auth/sesion.ts (React cache: una lectura por petición). Usa getClaims(), nunca getSession(). */
export type ObtenerUsuario = () => Promise<Usuario | null>; // `obtenerUsuario`
/** Redirige a /entrar?siguiente=<ruta> si no hay sesión. `siguiente` debe empezar por "/" y no por "//". */
export type ExigirUsuario = (siguiente?: string) => Promise<Usuario>; // `exigirUsuario`
/** notFound() si no es admin (no revela que /admin existe). */
export type ExigirAdmin = () => Promise<Usuario>; // `exigirAdmin`

/** src/lib/auth/aceptaciones.ts */
export type CondicionesAlDia = () => Promise<boolean>; // `condicionesAlDia`: ha aceptado las versiones vigentes de condiciones y privacidad
export type RegistrarAceptaciones = () => Promise<Resultado>; // `registrarAceptaciones`: inserta las dos versiones vigentes (VERSIONES_LEGALES)

/** src/lib/panel/local-actual.ts -> `obtenerLocalActual`: el local del dueño o notFound(). Para layouts y páginas de /panel/[local]. */
export type ObtenerLocalActual = (localId: string) => Promise<LocalResumen>;

/** src/lib/imagenes/reducir.ts (solo navegador) -> `reducirImagen`. */
export type ReducirImagen = (
  archivo: File,
  opciones: { ladoMax: number; tipo: "image/webp" | "image/png"; calidad?: number },
) => Promise<Blob>;

/** src/componentes/ui/SubirImagen.tsx (cliente). Reduce, sube al bucket con la sesión del navegador y devuelve la ruta. */
export type PropsSubirImagen = {
  /** Ruta de destino generada con rutaNuevoLogo / rutaNuevaFotoPlato. */
  generarRuta: () => string;
  tipo: "logo" | "foto";
  rutaActual: string | null;
  urlActual: string | null;
  etiqueta: string;
  onSubida: (ruta: string) => void;
  onQuitar?: () => void;
};

export type PropsBoton = {
  children: ReactNode;
  variante?: "primario" | "secundario" | "peligro" | "fantasma";
  tamano?: "normal" | "grande";
  type?: "button" | "submit";
  disabled?: boolean;
  cargando?: boolean;
  onClick?: () => void;
  className?: string;
};

// ===========================================================================
// CARRIL contenido · src/componentes/alergenos/*, src/lib/i18n/carta.<xx>.ts
// ===========================================================================

/** src/componentes/alergenos/IconoAlergeno.tsx (servidor o cliente, SVG en línea, sin JS). */
export type PropsIconoAlergeno = {
  codigo: CodigoAlergeno;
  /** px; por defecto 24. */
  tamano?: number;
  /** Si se pasa, el SVG lleva <title> y role="img"; si no, aria-hidden. */
  titulo?: string;
  className?: string;
};

/** src/lib/i18n/carta.ts (índice, del director) -> `diccionarioCarta`. */
export type ObtenerDiccionarioCarta = (idioma: IdiomaCarta) => DiccionarioCarta;

// ===========================================================================
// CARRIL carta-publica · src/componentes/carta/*
// ===========================================================================

/** src/componentes/carta/CartaVista.tsx (componente de servidor; sin datos propios). */
export type PropsCartaVista = {
  carta: CartaPublica;
  idioma: IdiomaCarta;
  diccionario: DiccionarioCarta;
  /** "vista_previa" muestra una banda «Así verán tu carta» y no envía estadísticas. */
  modo: "publica" | "vista_previa";
};

// ===========================================================================
// v0.2 · CARRIL datos-v02 · src/lib/datos/*
// ===========================================================================

export type EntradaIdiomas = { localId: string; idiomas: IdiomaCarta[] };
export type EntradaTraduccionManual = {
  localId: string;
  tabla: TablaTraducible;
  filaId: string;
  campo: string;
  idioma: IdiomaDestino;
  texto: string;
};

/** src/lib/datos/traducciones.ts */
export type ListarTextosTraducibles = (localId: string) => Promise<TextoTraducible[]>; // `listarTextosTraducibles`
/** Llama a la función SQL guardar_traducciones_auto: fusiona campo a campo y NUNCA pisa origen "manual". */
export type GuardarTraduccionesAuto = (localId: string, lote: TraduccionAGuardar[]) => Promise<Resultado<{ guardadas: number }>>; // `guardarTraduccionesAuto`
export type GuardarTraduccionManual = (entrada: EntradaTraduccionManual) => Promise<Resultado>; // `guardarTraduccionManual`
/** Quita la corrección manual de un campo (vuelve a "auto" en la próxima traducción). */
export type DescartarTraduccionManual = (entrada: Omit<EntradaTraduccionManual, "texto">) => Promise<Resultado>; // `descartarTraduccionManual`
export type ActualizarIdiomasActivos = (entrada: EntradaIdiomas) => Promise<Resultado>; // `actualizarIdiomasActivos`
/** Reserva `caracteres` de la cuota (diaria por local y mensual global). false = no queda cuota. */
export type ConsumirCuotaTraduccion = (localId: string, caracteres: number) => Promise<boolean>; // `consumirCuotaTraduccion`

/** src/lib/datos/estadisticas.ts */
export type RegistrarEvento = (evento: EventoEstadistica) => Promise<void>; // `registrarEvento` (crearClientePublico + rpc)
export type ObtenerResumenEstadisticas = (localId: string, dias: 7 | 30 | 90) => Promise<ResumenEstadisticas>; // `obtenerResumenEstadisticas`

// ===========================================================================
// v0.2 · CARRIL traduccion · src/lib/traduccion/*
// ===========================================================================

/** src/lib/dominio/huella.ts (carril datos-v02) -> `calcularHuella` (Web Crypto SHA-256 de trim+NFC, 16 hex). */
export type CalcularHuella = (texto: string) => Promise<string>;
/** src/lib/traduccion/planificar.ts -> `planificarTraducciones` (pura). */
export type PlanificarTraducciones = (textos: TextoTraducible[], idiomas: IdiomaDestino[]) => Pendiente[];
/** src/lib/traduccion/estado.ts -> `resumirTraducciones` (pura). */
export type ResumirTraducciones = (textos: TextoTraducible[], idiomas: IdiomaDestino[]) => ResumenTraduccion[];
/** src/lib/traduccion/traducir-local.ts -> `traducirLocal`. No hace nada si TRADUCCION_ACTIVA no es "true". */
export type TraducirLocal = (localId: string) => Promise<Resultado<ResultadoTraducirLocal>>;
