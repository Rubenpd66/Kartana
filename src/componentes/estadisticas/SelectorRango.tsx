import Link from "next/link";
import { estadisticasEs as t } from "@/lib/i18n/estadisticas.es";

export const RANGOS = [7, 30, 90] as const;
export type Rango = (typeof RANGOS)[number];

/** Convierte el `?dias=` de la dirección en un rango válido (7 por defecto). */
export function leerRango(valor: string | string[] | undefined): Rango {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  return (RANGOS as readonly number[]).includes(n) ? (n as Rango) : 7;
}

/** Tres enlaces (7 / 30 / 90 días): funcionan sin JS y se pueden compartir. */
export function SelectorRango({ base, actual }: { base: string; actual: Rango }) {
  return (
    <nav aria-label={t.rango.etiqueta}>
      <ul className="flex gap-2">
        {RANGOS.map((r) => (
          <li key={r} className="flex-1">
            <Link
              href={`${base}?dias=${r}`}
              aria-current={r === actual ? "page" : undefined}
              className={`flex min-h-12 items-center justify-center rounded-[14px] border px-3 font-semibold ${
                r === actual ? "border-primario bg-primario text-sobre-primario" : "border-borde bg-superficie text-texto hover:bg-superficie-suave"
              }`}
            >
              {t.rango.opciones[r]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
