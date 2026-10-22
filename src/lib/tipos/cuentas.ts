// Tipos de cuentas, acceso (prueba, piloto, suscripción) y administración. Solo tipos.

/** Usuario con sesión, tal y como lo devuelve src/lib/auth/sesion.ts (a partir de getClaims()). */
export type Usuario = {
  id: string;
  correo: string;
  /** true solo si app_metadata.rol === "admin" Y el correo está en ADMIN_EMAILS. */
  esAdmin: boolean;
};

/** Fila de `perfiles` (1:1 con auth.users). */
export type Perfil = {
  id: string;
  correo: string;
  nombre: string | null;
  /** Fecha en que se concedió la prueba gratis (solo una por persona). null = aún no usada. */
  pruebaUsadaEn: string | null;
  creadoEn: string;
};

export type DocumentoAceptable = "condiciones" | "privacidad";

/** Fila de `aceptaciones_legales` (solo inserción; historial). */
export type AceptacionLegal = {
  documento: DocumentoAceptable;
  /** Versión aceptada: VERSIONES_LEGALES de src/lib/legal/documentos.ts ("AAAA-MM-DD"). */
  version: string;
  aceptadaEn: string;
};

/**
 * Estado guardado del acceso de un local.
 * - prueba: 30 días gratis al crear el primer local (una vez por persona).
 * - piloto: 60 días gratis que activa el admin.
 * - cortesia: gratis sin fecha de fin (carta de ejemplo, casos especiales).
 * - suscripcion: pagada con Stripe (v0.6).
 * - vencido: sin acceso (la carta pública deja de verse; el panel sigue accesible).
 */
export type EstadoAcceso = "prueba" | "piloto" | "cortesia" | "suscripcion" | "vencido";

export type Plan = "carta" | "carta_resenas";

/** Fila de `accesos` (1:1 con locales). */
export type Acceso = {
  localId: string;
  estado: EstadoAcceso;
  plan: Plan;
  /** ISO 8601. null = sin fecha de fin (cortesía o suscripción gestionada por Stripe). */
  vigenteHasta: string | null;
  notas: string | null;
  actualizadoEn: string;
};

/** Acceso calculado «ahora»: lo que de verdad cuenta para mostrar la carta. */
export type AccesoEfectivo = {
  estado: EstadoAcceso;
  plan: Plan;
  /** estado distinto de "vencido" y (vigenteHasta null o en el futuro). */
  activo: boolean;
  /** Días enteros que quedan (redondeo hacia arriba); null si no hay fecha de fin. */
  diasRestantes: number | null;
  vigenteHasta: string | null;
};

/** Una fila del panel de administración. */
export type FilaAdmin = {
  localId: string;
  nombre: string;
  slug: string;
  publicado: boolean;
  correoDueno: string;
  creadoEn: string;
  acceso: AccesoEfectivo;
  /** Número de platos (visibles o no). */
  numPlatos: number;
};
