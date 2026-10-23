import { calcularIdiomas } from "@/lib/estadisticas/idiomas";
import { estadisticasEs as t } from "@/lib/i18n/estadisticas.es";
import { NOMBRE_IDIOMA } from "@/lib/i18n/idiomas";
import type { DiaEstadistica } from "@/lib/tipos/estadisticas";

/** Lista de idiomas con porcentaje y barra (el número también va en texto, no solo en la barra). */
export function ResumenIdiomas({ dias }: { dias: DiaEstadistica[] }) {
  const filas = calcularIdiomas(dias);
  if (filas.length === 0) return <p className="text-texto-suave">{t.idiomas.sinDatos}</p>;
  return (
    <ul className="space-y-3">
      {filas.map((f) => (
        <li key={f.idioma}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">{NOMBRE_IDIOMA[f.idioma]}</span>
            <span className="text-texto-suave tabular-nums">
              {f.porcentaje} % · {t.idiomas.visitas(f.visitas)}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-superficie-suave" aria-hidden="true">
            <div className="h-full rounded-full bg-primario" style={{ width: `${f.porcentaje}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
