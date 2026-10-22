// Estadísticas anónimas y agregadas (v0.2). Solo tipos.
// Regla: ni cookies, ni localStorage, ni IP, ni identificadores. Solo contadores por día.

import type { IdiomaCarta } from "@/lib/i18n/idiomas";

/**
 * Cuerpo JSON que la carta pública envía a POST /api/e (con navigator.sendBeacon).
 * Máximo 4 KB. El servidor lo valida con Zod y descarta lo que no encaje.
 * - "visita": una por carga de página de la carta. `platos` puede ir vacío.
 * - "vistas": lote de platos vistos (>= 50 % en pantalla durante >= 1 s), se envía al ocultar la página.
 *   Cada id aparece como mucho una vez por lote. Máximo 100 ids.
 * Los clics en «dejar reseña» NO usan este canal: se cuentan en GET /r/<slug> (v0.3).
 */
export type EventoEstadistica = {
  tipo: "visita" | "vistas";
  localId: string;
  idioma: IdiomaCarta;
  platos: string[];
};

export type DiaEstadistica = {
  /** "AAAA-MM-DD" en hora de Madrid. */
  dia: string;
  visitas: number;
  clicsResena: number;
  visitasPorIdioma: Partial<Record<IdiomaCarta, number>>;
};

export type PlatoMasVisto = {
  platoId: string;
  nombre: string;
  vistas: number;
};

export type ResumenEstadisticas = {
  desde: string;
  hasta: string;
  /** Un elemento por día del rango, también los días a cero. */
  dias: DiaEstadistica[];
  totalVisitas: number;
  totalClicsResena: number;
  /** Los 10 más vistos del rango. */
  platosMasVistos: PlatoMasVisto[];
};
