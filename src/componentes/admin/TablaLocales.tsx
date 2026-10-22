import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { adminEs as t } from "@/lib/i18n/admin.es";
import type { FilaAdmin } from "@/lib/tipos/cuentas";
import { FilaLocal } from "./FilaLocal";
import { resumenEstados } from "./formato";

/** Cifras de arriba (sobre todos los locales, no solo los filtrados). */
export function Resumen({ filas }: { filas: FilaAdmin[] }) {
  const r = resumenEstados(filas);
  const cifras = [
    [r.locales, t.resumen.locales],
    [r.publicados, t.resumen.publicados],
    [r.prueba, t.resumen.prueba],
    [r.piloto, t.resumen.piloto],
    [r.vencidos, t.resumen.vencidos],
  ] as const;
  return (
    <dl aria-label={t.resumen.etiqueta} className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cifras.map(([n, texto]) => (
        <Tarjeta key={texto} como="div">
          <dd className="font-titulo text-[1.75rem] font-semibold leading-tight">{n}</dd>
          <dt className="text-sm text-texto-suave">{texto}</dt>
        </Tarjeta>
      ))}
    </dl>
  );
}

/** Lista de locales: tarjetas en una columna en móvil y en dos en escritorio. */
export function TablaLocales({ filas }: { filas: FilaAdmin[] }) {
  if (filas.length === 0) return <p className="text-texto-suave">{t.vacio}</p>;
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {filas.map((f) => (
        <li key={f.localId}>
          <FilaLocal fila={f} />
        </li>
      ))}
    </ul>
  );
}
