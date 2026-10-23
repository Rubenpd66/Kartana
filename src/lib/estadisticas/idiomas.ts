import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { DiaEstadistica } from "@/lib/tipos/estadisticas";

export type FilaIdioma = { idioma: IdiomaCarta; visitas: number; porcentaje: number };

/** Suma las visitas por idioma de todos los días, de mayor a menor, con porcentaje entero. */
export function calcularIdiomas(dias: DiaEstadistica[]): FilaIdioma[] {
  const suma = new Map<IdiomaCarta, number>();
  for (const d of dias) {
    for (const [idioma, n] of Object.entries(d.visitasPorIdioma) as Array<[IdiomaCarta, number]>) {
      suma.set(idioma, (suma.get(idioma) ?? 0) + n);
    }
  }
  const total = [...suma.values()].reduce((s, n) => s + n, 0);
  if (total === 0) return [];
  return [...suma.entries()]
    .map(([idioma, visitas]) => ({ idioma, visitas, porcentaje: Math.round((visitas / total) * 100) }))
    .sort((a, b) => b.visitas - a.visitas);
}
