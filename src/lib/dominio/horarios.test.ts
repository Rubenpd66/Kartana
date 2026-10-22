import { describe, expect, it } from "vitest";
import type { FranjaHoraria } from "@/lib/tipos/dominio";
import { resumirHorarios } from "./horarios";

const diccionario = {
  diasCortos: { 1: "L", 2: "M", 3: "X", 4: "J", 5: "V", 6: "S", 7: "D" },
  textos: { cerrado: "Cerrado" },
} as unknown as Parameters<typeof resumirHorarios>[1];

const franja = (dia: FranjaHoraria["dia"], abre: string, cierra: string): FranjaHoraria => ({ dia, abre, cierra });

describe("resumirHorarios", () => {
  it("devuelve lista vacía si no hay horarios", () => {
    expect(resumirHorarios([], diccionario)).toEqual([]);
  });

  it("agrupa L–V con la misma franja y marca cerrados los demás", () => {
    const horarios = ([1, 2, 3, 4, 5] as const).map((d) => franja(d, "13:00", "16:00"));
    expect(resumirHorarios(horarios, diccionario)).toEqual([
      { dias: "L–V", franjas: "13:00–16:00" },
      { dias: "S–D", franjas: "Cerrado" },
    ]);
  });

  it("ordena las franjas de un día y las une", () => {
    const horarios = [franja(6, "20:00", "23:30"), franja(6, "12:00", "16:00"), franja(7, "12:00", "16:00")];
    expect(resumirHorarios(horarios, diccionario)).toEqual([
      { dias: "L–V", franjas: "Cerrado" },
      { dias: "S", franjas: "12:00–16:00, 20:00–23:30" },
      { dias: "D", franjas: "12:00–16:00" },
    ]);
  });

  it("muestra una franja que cruza la medianoche tal cual", () => {
    const horarios = [franja(5, "20:00", "02:00"), franja(6, "20:00", "02:00")];
    expect(resumirHorarios(horarios, diccionario)).toEqual([
      { dias: "L–J", franjas: "Cerrado" },
      { dias: "V–S", franjas: "20:00–02:00" },
      { dias: "D", franjas: "Cerrado" },
    ]);
  });

  it("no junta días iguales que no son seguidos", () => {
    const horarios = [franja(1, "09:00", "14:00"), franja(3, "09:00", "14:00")];
    const resumen = resumirHorarios(horarios, diccionario);
    expect(resumen.map((r) => r.dias)).toEqual(["L", "M", "X", "J–D"]);
  });

  it("el orden de entrada no importa", () => {
    const a = [franja(2, "10:00", "14:00"), franja(1, "10:00", "14:00")];
    const b = [franja(1, "10:00", "14:00"), franja(2, "10:00", "14:00")];
    expect(resumirHorarios(a, diccionario)).toEqual(resumirHorarios(b, diccionario));
  });
});
