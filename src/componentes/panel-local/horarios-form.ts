import { LIMITES } from "@/lib/dominio/limites";
import type { DiaSemana, FranjaHoraria } from "@/lib/tipos/dominio";

// Estado del formulario de horarios y su conversión a FranjaHoraria[] (lógica pura).

export const DIAS: readonly DiaSemana[] = [1, 2, 3, 4, 5, 6, 7];
const LABORABLES: readonly DiaSemana[] = [2, 3, 4, 5];
const FRANJA_NUEVA = { abre: "13:00", cierra: "16:00" };

export type FranjaForm = { abre: string; cierra: string };
export type DiaForm = { abierto: boolean; franjas: FranjaForm[] };
export type HorariosForm = Record<DiaSemana, DiaForm>;

const clonar = (f: FranjaForm[]): FranjaForm[] => f.map((x) => ({ ...x }));

function copia(e: HorariosForm): HorariosForm {
  const salida = {} as HorariosForm;
  for (const d of DIAS) salida[d] = { abierto: e[d].abierto, franjas: clonar(e[d].franjas) };
  return salida;
}

export function desdeFranjas(franjas: FranjaHoraria[]): HorariosForm {
  const e = {} as HorariosForm;
  for (const d of DIAS) {
    const delDia = franjas
      .filter((f) => f.dia === d)
      .sort((a, b) => a.abre.localeCompare(b.abre))
      .map((f) => ({ abre: f.abre, cierra: f.cierra }));
    e[d] = { abierto: delDia.length > 0, franjas: delDia };
  }
  return e;
}

export function aFranjas(e: HorariosForm): FranjaHoraria[] {
  return DIAS.flatMap((dia) => (e[dia].abierto ? e[dia].franjas.map((f) => ({ dia, abre: f.abre, cierra: f.cierra })) : []));
}

export function abrirDia(e: HorariosForm, dia: DiaSemana): HorariosForm {
  const s = copia(e);
  s[dia].abierto = true;
  if (s[dia].franjas.length === 0) s[dia].franjas = [{ ...FRANJA_NUEVA }];
  return s;
}

export function cerrarDia(e: HorariosForm, dia: DiaSemana): HorariosForm {
  const s = copia(e);
  s[dia].abierto = false;
  return s;
}

export function anadirFranja(e: HorariosForm, dia: DiaSemana): HorariosForm {
  const s = copia(e);
  if (s[dia].franjas.length < LIMITES.franjasPorDia) s[dia].franjas.push({ ...FRANJA_NUEVA });
  return s;
}

export function quitarFranja(e: HorariosForm, dia: DiaSemana, indice: number): HorariosForm {
  const s = copia(e);
  s[dia].franjas.splice(indice, 1);
  if (s[dia].franjas.length === 0) s[dia].abierto = false;
  return s;
}

export function cambiarHora(e: HorariosForm, dia: DiaSemana, indice: number, campo: "abre" | "cierra", valor: string): HorariosForm {
  const s = copia(e);
  s[dia].franjas[indice][campo] = valor;
  return s;
}

/** Copia el lunes a martes–viernes (los días laborables). Sábado y domingo no se tocan. */
export function copiarLunesALaborables(e: HorariosForm): HorariosForm {
  const s = copia(e);
  for (const d of LABORABLES) s[d] = { abierto: s[1].abierto, franjas: clonar(s[1].franjas) };
  return s;
}

/** true si alguna franja abierta tiene la misma hora de apertura y de cierre (o está vacía). */
export function hayFranjaIgual(e: HorariosForm): boolean {
  return DIAS.some((d) => e[d].abierto && e[d].franjas.some((f) => f.abre === "" || f.cierra === "" || f.abre === f.cierra));
}
