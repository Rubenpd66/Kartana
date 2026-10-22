import type { DiaSemana, FranjaHoraria } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

const DIAS: DiaSemana[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * Agrupa días seguidos con las mismas franjas: [{ dias: "L–V", franjas: "13:00–16:00, 20:00–23:30" }].
 * Los días sin franjas salen como «Cerrado». Una franja que cruza la medianoche se muestra tal cual («20:00–02:00»).
 * Sin horarios devuelve [].
 */
export function resumirHorarios(
  horarios: FranjaHoraria[],
  diccionario: Pick<DiccionarioCarta, "diasCortos" | "textos">,
): Array<{ dias: string; franjas: string }> {
  if (horarios.length === 0) return [];

  const textoDia = (dia: DiaSemana) => {
    const franjas = horarios
      .filter((f) => f.dia === dia)
      .sort((a, b) => a.abre.localeCompare(b.abre) || a.cierra.localeCompare(b.cierra))
      .map((f) => `${f.abre}–${f.cierra}`);
    return franjas.length > 0 ? franjas.join(", ") : diccionario.textos.cerrado;
  };

  const grupos: Array<{ desde: DiaSemana; hasta: DiaSemana; franjas: string }> = [];
  for (const dia of DIAS) {
    const franjas = textoDia(dia);
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.franjas === franjas) ultimo.hasta = dia;
    else grupos.push({ desde: dia, hasta: dia, franjas });
  }

  return grupos.map(({ desde, hasta, franjas }) => ({
    dias:
      desde === hasta
        ? diccionario.diasCortos[desde]
        : `${diccionario.diasCortos[desde]}–${diccionario.diasCortos[hasta]}`,
    franjas,
  }));
}
