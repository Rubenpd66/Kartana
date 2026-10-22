import { describe, expect, it } from "vitest";
import {
  abrirDia,
  anadirFranja,
  aFranjas,
  cerrarDia,
  copiarLunesALaborables,
  desdeFranjas,
  hayFranjaIgual,
  quitarFranja,
} from "./horarios-form";

describe("desdeFranjas / aFranjas", () => {
  it("ida y vuelta conserva las franjas y ordena por día", () => {
    const franjas = [
      { dia: 2 as const, abre: "13:00", cierra: "16:00" },
      { dia: 1 as const, abre: "09:00", cierra: "12:00" },
      { dia: 1 as const, abre: "20:00", cierra: "23:30" },
    ];
    expect(aFranjas(desdeFranjas(franjas))).toEqual([
      { dia: 1, abre: "09:00", cierra: "12:00" },
      { dia: 1, abre: "20:00", cierra: "23:30" },
      { dia: 2, abre: "13:00", cierra: "16:00" },
    ]);
  });

  it("sin franjas, todos los días cerrados y lista vacía", () => {
    const e = desdeFranjas([]);
    expect(Object.values(e).every((d) => !d.abierto)).toBe(true);
    expect(aFranjas(e)).toEqual([]);
  });

  it("un día cerrado no genera franjas aunque conserve las horas", () => {
    const e = cerrarDia(abrirDia(desdeFranjas([]), 3), 3);
    expect(aFranjas(e)).toEqual([]);
  });
});

describe("abrir, añadir y quitar franjas", () => {
  it("abrir un día pone una franja por defecto", () => {
    const e = abrirDia(desdeFranjas([]), 5);
    expect(e[5].abierto).toBe(true);
    expect(e[5].franjas).toHaveLength(1);
  });

  it("máximo 3 franjas por día", () => {
    let e = abrirDia(desdeFranjas([]), 1);
    e = anadirFranja(anadirFranja(e, 1), 1);
    expect(e[1].franjas).toHaveLength(3);
    e = anadirFranja(e, 1);
    expect(e[1].franjas).toHaveLength(3);
  });

  it("quitar la última franja cierra el día", () => {
    const e = quitarFranja(abrirDia(desdeFranjas([]), 1), 1, 0);
    expect(e[1].abierto).toBe(false);
  });

  it("quitar una de varias deja las demás", () => {
    let e = anadirFranja(abrirDia(desdeFranjas([]), 1), 1);
    e = quitarFranja(e, 1, 0);
    expect(e[1].franjas).toHaveLength(1);
    expect(e[1].abierto).toBe(true);
  });
});

describe("copiarLunesALaborables", () => {
  it("copia el lunes a martes–viernes y no toca sábado ni domingo", () => {
    const base = desdeFranjas([
      { dia: 1, abre: "08:00", cierra: "16:00" },
      { dia: 6, abre: "10:00", cierra: "14:00" },
    ]);
    const e = copiarLunesALaborables(base);
    for (const d of [2, 3, 4, 5] as const) expect(e[d].franjas).toEqual([{ abre: "08:00", cierra: "16:00" }]);
    expect(e[6].franjas).toEqual([{ abre: "10:00", cierra: "14:00" }]);
    expect(e[7].abierto).toBe(false);
  });

  it("si el lunes está cerrado, cierra los laborables", () => {
    const base = desdeFranjas([{ dia: 3, abre: "08:00", cierra: "16:00" }]);
    const e = copiarLunesALaborables(base);
    expect(e[3].abierto).toBe(false);
  });

  it("no comparte referencias entre días", () => {
    const e = copiarLunesALaborables(desdeFranjas([{ dia: 1, abre: "08:00", cierra: "16:00" }]));
    expect(e[2].franjas).not.toBe(e[1].franjas);
  });
});

describe("hayFranjaIgual", () => {
  it("detecta una franja con la misma hora de apertura y cierre", () => {
    const e = desdeFranjas([{ dia: 1, abre: "08:00", cierra: "16:00" }]);
    expect(hayFranjaIgual(e)).toBe(false);
    e[1].franjas[0].cierra = "08:00";
    expect(hayFranjaIgual(e)).toBe(true);
  });
  it("ignora días cerrados", () => {
    const e = cerrarDia(desdeFranjas([{ dia: 1, abre: "08:00", cierra: "08:00" }]), 1);
    expect(hayFranjaIgual(e)).toBe(false);
  });
});
