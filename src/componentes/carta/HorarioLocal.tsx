import { resumirHorarios } from "@/lib/dominio/horarios";
import type { FranjaHoraria } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

/** Horario plegable (un <details>, sin JavaScript). Nada si el bar no ha puesto horario. */
export function HorarioLocal({ horarios, diccionario }: { horarios: FranjaHoraria[]; diccionario: DiccionarioCarta }) {
  const filas = resumirHorarios(horarios, diccionario);
  if (filas.length === 0) return null;
  return (
    <details className="horario w-full sm:w-auto">
      <summary className="pastilla w-fit">{diccionario.textos.horario}</summary>
      <dl className="lista-horario mt-2 rounded-xl px-3 py-2 text-[0.9375rem]">
        {filas.map((fila) => (
          <div key={fila.dias} className="flex justify-between gap-4 py-0.5">
            <dt className="font-semibold">{fila.dias}</dt>
            <dd className="text-right">{fila.franjas}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
