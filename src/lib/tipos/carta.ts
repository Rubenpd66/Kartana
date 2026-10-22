// Tipos de la carta: local, secciones, platos, menús del día. Solo tipos.
// En TypeScript todo va en camelCase; la base de datos usa snake_case y el carril de
// datos hace la conversión en src/lib/datos/* (ver docs/arquitectura.md).

import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type {
  CampoTraducibleLocal,
  CampoTraducibleMenu,
  CampoTraduciblePlato,
  CampoTraducibleSeccion,
  CodigoAlergeno,
  CodigoEtiqueta,
  DiaSemana,
  FranjaHoraria,
  HoraTexto,
  Precio,
  PrecioEntrada,
  Traducciones,
} from "./dominio";
import type { AccesoEfectivo } from "./cuentas";

// ---------------------------------------------------------------------------
// Filas completas (lo que ve el dueño en su panel)
// ---------------------------------------------------------------------------

export type Local = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  /** Ruta dentro del bucket `imagenes` (p. ej. "<localId>/logo/ab12cd.png"); null si no hay logo. */
  logoRuta: string | null;
  /** "#rrggbb" en minúsculas, con contraste comprobado contra blanco (>= 4.5:1). */
  colorMarca: string;
  horarios: FranjaHoraria[];
  /** De momento siempre "es". */
  idiomaBase: IdiomaCarta;
  /** Siempre incluye "es". Los demás se activan en la v0.2. */
  idiomasActivos: IdiomaCarta[];
  traducciones: Traducciones<CampoTraducibleLocal>;
  publicado: boolean;
  /** El dueño puede pedir que su carta no aparezca en buscadores. */
  permitirIndexar: boolean;
  creadoEn: string;
  actualizadoEn: string;
};

/** Datos mínimos de un local para menús, cabeceras y listas. */
export type LocalResumen = Pick<Local, "id" | "slug" | "nombre" | "publicado"> & {
  acceso: AccesoEfectivo;
};

export type Seccion = {
  id: string;
  localId: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  visible: boolean;
  traducciones: Traducciones<CampoTraducibleSeccion>;
};

export type Plato = {
  id: string;
  localId: string;
  seccionId: string;
  nombre: string;
  descripcion: string | null;
  /** Variantes de venta, en orden: de 1 a 6 (ver Precio). */
  precios: Precio[];
  alergenos: CodigoAlergeno[];
  /** «Puede contener trazas de…» (opcional, mismos códigos). */
  trazas: CodigoAlergeno[];
  /**
   * El dueño ha marcado que revisó los alérgenos de este plato.
   * Si es false y la lista está vacía, la carta NO dice «sin alérgenos»: dice «consulte al personal».
   */
  alergenosConfirmados: boolean;
  etiquetas: CodigoEtiqueta[];
  /** Ruta en el bucket `imagenes` ("<localId>/platos/<platoId>/<aleatorio>.webp") o null. */
  fotoRuta: string | null;
  orden: number;
  agotado: boolean;
  visible: boolean;
  traducciones: Traducciones<CampoTraduciblePlato>;
  actualizadoEn: string;
};

/** Un plato dentro de un menú del día. `id` es estable (lo genera el servidor) para las traducciones. */
export type ItemMenu = {
  id: string;
  nombre: string;
  alergenos: CodigoAlergeno[];
  alergenosConfirmados: boolean;
};

/** Un grupo del menú del día: «Primeros», «Segundos», «Postres»… */
export type GrupoMenu = {
  id: string;
  titulo: string;
  items: ItemMenu[];
};

export type Menu = {
  id: string;
  localId: string;
  nombre: string;
  precioCentimos: number | null;
  dias: DiaSemana[];
  /** Ambas null (todo el día) o ambas con valor y horaInicio < horaFin. */
  horaInicio: HoraTexto | null;
  horaFin: HoraTexto | null;
  grupos: GrupoMenu[];
  /** P. ej. «Incluye pan, bebida y postre o café». */
  notas: string | null;
  orden: number;
  visible: boolean;
  traducciones: Traducciones<CampoTraducibleMenu>;
};

/** Toda la carta de un local para el panel (incluye lo oculto). */
export type CartaPanel = {
  local: Local;
  acceso: AccesoEfectivo;
  secciones: Array<Seccion & { platos: Plato[] }>;
  menus: Menu[];
};

// ---------------------------------------------------------------------------
// Carta pública (lo que se cachea y ve cualquiera). Sin dueño, sin acceso, sin fechas internas.
// ---------------------------------------------------------------------------

export type LocalPublico = Pick<
  Local,
  | "id"
  | "slug"
  | "nombre"
  | "descripcion"
  | "direccion"
  | "telefono"
  | "colorMarca"
  | "horarios"
  | "idiomaBase"
  | "idiomasActivos"
  | "traducciones"
  | "permitirIndexar"
  | "actualizadoEn"
> & {
  /** URL pública absoluta del logo o null. */
  logoUrl: string | null;
};

export type PlatoPublico = Omit<Plato, "localId" | "seccionId" | "fotoRuta" | "visible" | "actualizadoEn"> & {
  /** URL pública absoluta de la foto o null. */
  fotoUrl: string | null;
};

export type SeccionPublica = Omit<Seccion, "localId" | "visible"> & {
  /** Solo platos visibles, ordenados por `orden`. */
  platos: PlatoPublico[];
};

export type MenuPublico = Omit<Menu, "localId" | "visible">;

/** Lo que devuelve obtenerCartaPublica(slug). Solo existe si el local está publicado y con acceso activo. */
export type CartaPublica = {
  local: LocalPublico;
  /** Solo secciones visibles con al menos un plato visible, ordenadas. */
  secciones: SeccionPublica[];
  /** Solo menús visibles, ordenados. */
  menus: MenuPublico[];
};

/** Entrada del sitemap para una carta indexable. */
export type CartaIndexable = {
  slug: string;
  /** Idiomas con página propia indexable (siempre incluye "es"). */
  idiomas: IdiomaCarta[];
  actualizadoEn: string;
};

// ---------------------------------------------------------------------------
// Entradas (lo que validan los esquemas Zod de src/lib/validacion/* antes de guardar)
// Los esquemas deben declararse `satisfies z.ZodType<EntradaX>`.
// ---------------------------------------------------------------------------

export type EntradaCrearLocal = {
  nombre: string;
  slug: string;
};

export type EntradaLocal = {
  localId: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  colorMarca: string;
  permitirIndexar: boolean;
};

export type EntradaHorarios = {
  localId: string;
  horarios: FranjaHoraria[];
};

export type EntradaLogo = {
  localId: string;
  /** Ruta ya subida al bucket por el navegador; null para quitar el logo. */
  logoRuta: string | null;
};

export type EntradaPublicar = {
  localId: string;
  publicado: boolean;
};

export type EntradaSeccion = {
  localId: string;
  /** Ausente al crear. */
  seccionId?: string;
  nombre: string;
  descripcion: string | null;
  visible: boolean;
};

export type EntradaPlato = {
  localId: string;
  /**
   * Id del plato. Al crear, el navegador puede generarlo (crypto.randomUUID()) para subir la foto
   * a su carpeta antes de guardar: si no existe, se crea el plato con ese id. Si falta, lo genera el servidor.
   */
  platoId?: string;
  /** true al crear (con o sin platoId); false al editar uno existente. */
  esNuevo: boolean;
  seccionId: string;
  nombre: string;
  descripcion: string | null;
  /** 1 a 6 variantes; las nuevas sin id (el servidor lo asigna y conserva los existentes). */
  precios: PrecioEntrada[];
  alergenos: CodigoAlergeno[];
  trazas: CodigoAlergeno[];
  alergenosConfirmados: boolean;
  etiquetas: CodigoEtiqueta[];
  /** Ruta ya subida al bucket por el navegador; null = sin foto. */
  fotoRuta: string | null;
  visible: boolean;
};

export type EntradaAgotado = {
  localId: string;
  platoId: string;
  agotado: boolean;
};

export type TablaOrdenable = "secciones" | "platos" | "menus";

export type EntradaOrden = {
  localId: string;
  tabla: TablaOrdenable;
  /** Todos los ids del grupo (misma sección para platos), en el orden nuevo. Máximo 200. */
  ids: string[];
};

/** Al guardar un menú, los grupos/ítems nuevos llegan sin id y el servidor se lo asigna. */
export type EntradaMenu = {
  localId: string;
  menuId?: string;
  nombre: string;
  precioCentimos: number | null;
  dias: DiaSemana[];
  horaInicio: HoraTexto | null;
  horaFin: HoraTexto | null;
  grupos: Array<{
    id?: string;
    titulo: string;
    items: Array<{ id?: string; nombre: string; alergenos: CodigoAlergeno[]; alergenosConfirmados: boolean }>;
  }>;
  notas: string | null;
  visible: boolean;
};
