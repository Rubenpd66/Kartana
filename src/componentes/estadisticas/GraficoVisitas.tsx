import { calcularGrafico } from "@/lib/estadisticas/grafico";
import { estadisticasEs as t } from "@/lib/i18n/estadisticas.es";

function fechaLarga(dia: string): string {
  const [a, m, d] = dia.split("-");
  return `${Number(d)}/${Number(m)}/${a}`;
}

/** Gráfico de barras de visitas por día: SVG hecho en el servidor, sin JS. Los datos exactos van en la tabla de debajo. */
export function GraficoVisitas({ dias }: { dias: Array<{ dia: string; visitas: number }> }) {
  const g = calcularGrafico(dias);
  const total = dias.reduce((s, d) => s + d.visitas, 0);
  const desde = dias.length ? fechaLarga(dias[0].dia) : "";
  const hasta = dias.length ? fechaLarga(dias[dias.length - 1].dia) : "";

  return (
    <div className="space-y-3">
      {g.hayDatos ? null : <p className="text-texto-suave">{t.grafico.sinDatos}</p>}
      <svg
        role="img"
        aria-labelledby="grafico-titulo grafico-desc"
        viewBox={`0 0 ${g.ancho} ${g.alto}`}
        className="h-auto w-full"
      >
        <title id="grafico-titulo">{t.grafico.titulo}</title>
        <desc id="grafico-desc">{t.grafico.descripcion(desde, hasta, total)}</desc>
        {g.marcasY.map((m) => (
          <g key={m.valor}>
            <line x1={g.margenIzq} x2={g.ancho} y1={m.y} y2={m.y} className="stroke-borde" strokeWidth={1} />
            <text x={g.margenIzq - 6} y={m.y + 4} textAnchor="end" fontSize={12} className="fill-texto-suave">
              {m.valor}
            </text>
          </g>
        ))}
        {g.barras.map((b) => (
          <rect key={b.dia} x={b.x} y={b.y} width={b.ancho} height={b.alto} rx={2} className="fill-primario" />
        ))}
        {g.etiquetas.map((e) => (
          <text key={e.texto + e.x} x={e.x} y={g.altoUtil + 20} textAnchor="middle" fontSize={12} className="fill-texto-suave">
            {e.texto}
          </text>
        ))}
      </svg>
      <details className="rounded-[14px] bg-superficie-suave">
        <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold">{t.grafico.verNumeros}</summary>
        <div className="max-h-80 overflow-auto px-4 pb-4">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th scope="col" className="py-1 pr-4 font-semibold">
                  {t.grafico.columnaDia}
                </th>
                <th scope="col" className="py-1 text-right font-semibold">
                  {t.grafico.columnaVisitas}
                </th>
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => (
                <tr key={d.dia} className="border-t border-borde">
                  <td className="py-1 pr-4">{fechaLarga(d.dia)}</td>
                  <td className="py-1 text-right tabular-nums">{d.visitas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
