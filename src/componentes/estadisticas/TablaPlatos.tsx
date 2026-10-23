import { estadisticasEs as t } from "@/lib/i18n/estadisticas.es";
import type { PlatoMasVisto } from "@/lib/tipos/estadisticas";

/** Los platos más vistos, del primero al décimo. */
export function TablaPlatos({ platos }: { platos: PlatoMasVisto[] }) {
  if (platos.length === 0) return <p className="text-texto-suave">{t.platos.sinDatos}</p>;
  return (
    <table className="w-full text-left">
      <thead>
        <tr>
          <th scope="col" className="py-2 pr-4 font-semibold">
            {t.platos.columnaPlato}
          </th>
          <th scope="col" className="py-2 text-right font-semibold">
            {t.platos.columnaVistas}
          </th>
        </tr>
      </thead>
      <tbody>
        {platos.map((p, i) => (
          <tr key={p.platoId} className="border-t border-borde">
            <td className="py-3 pr-4 [overflow-wrap:anywhere]">
              <span className="text-texto-suave tabular-nums">{i + 1}. </span>
              {p.nombre}
            </td>
            <td className="py-3 text-right font-semibold tabular-nums">{p.vistas}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
