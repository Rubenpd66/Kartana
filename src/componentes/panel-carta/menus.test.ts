import { describe, expect, it } from "vitest";
import { cartaEs } from "@/lib/i18n/carta.es";
import type { Menu } from "@/lib/tipos/carta";
import { entradaDesdeEstado, estadoDesdeMenu, resumirDias, resumirHorarioMenu, validarEstadoMenu } from "./menus";

const LOCAL = "3f1c2d4e-0000-4000-8000-000000000001";
const MENU = "3f1c2d4e-0000-4000-8000-000000000009";

const menu: Menu = {
  id: MENU,
  localId: LOCAL,
  nombre: "Menú del día",
  precioCentimos: 1250,
  dias: [1, 2, 3, 4, 5],
  horaInicio: "13:00",
  horaFin: "16:00",
  grupos: [
    { id: "g1aaaa", titulo: "Primeros", items: [{ id: "i1aaaa", nombre: "Lentejas", alergenos: ["apio"], alergenosConfirmados: true }] },
    { id: "g2aaaa", titulo: "Postres", items: [] },
  ],
  notas: "Incluye pan y bebida",
  orden: 0,
  visible: true,
  traducciones: {},
};

describe("resumirDias", () => {
  it("rangos seguidos con guion y sueltos con comas", () => {
    expect(resumirDias([1, 2, 3, 4, 5], cartaEs.diasCortos)).toBe("L–V");
    expect(resumirDias([1, 3, 5], cartaEs.diasCortos)).toBe("L, X, V");
    expect(resumirDias([1, 2, 3, 6, 7], cartaEs.diasCortos)).toBe("L–X, S, D");
    expect(resumirDias([6, 7], cartaEs.diasCortos)).toBe("S, D");
    expect(resumirDias([3], cartaEs.diasCortos)).toBe("X");
    expect(resumirDias([5, 1, 2], cartaEs.diasCortos)).toBe("L, M, V");
  });
});

describe("resumirHorarioMenu", () => {
  it("con horas usa la plantilla de la carta; sin horas, «Todo el día»", () => {
    expect(resumirHorarioMenu(menu, cartaEs)).toBe("L–V, de 13:00 a 16:00");
    expect(resumirHorarioMenu({ ...menu, horaInicio: null, horaFin: null }, cartaEs)).toBe("L–V · Todo el día");
  });
});

describe("estado del editor de menús", () => {
  it("menú nuevo: nombre por defecto, de lunes a viernes, todo el día y Primeros, Segundos, Postres", () => {
    const e = estadoDesdeMenu(null);
    expect(e.nombre).toBe("Menú del día");
    expect(e.dias).toEqual([1, 2, 3, 4, 5]);
    expect(e.todoElDia).toBe(true);
    expect(e.grupos.map((g) => g.titulo)).toEqual(["Primeros", "Segundos", "Postres"]);
    expect(e.grupos.every((g) => g.items.length === 1 && g.items[0].nombre === "")).toBe(true);
  });

  it("ida y vuelta de un menú existente conserva los ids de grupos e ítems", () => {
    const { entrada, errores } = entradaDesdeEstado(LOCAL, MENU, estadoDesdeMenu(menu));
    expect(errores).toEqual({});
    expect(entrada).toEqual({
      localId: LOCAL,
      menuId: MENU,
      nombre: "Menú del día",
      precioCentimos: 1250,
      dias: [1, 2, 3, 4, 5],
      horaInicio: "13:00",
      horaFin: "16:00",
      grupos: [
        { id: "g1aaaa", titulo: "Primeros", items: [{ id: "i1aaaa", nombre: "Lentejas", alergenos: ["apio"], alergenosConfirmados: true }] },
        { id: "g2aaaa", titulo: "Postres", items: [] },
      ],
      notas: "Incluye pan y bebida",
      visible: true,
    });
  });

  it("los ítems sin nombre no se envían; todo el día deja las horas en null; precio vacío es null", () => {
    const e = estadoDesdeMenu(null);
    e.precio = "";
    e.horaInicio = "13:00";
    const { entrada } = entradaDesdeEstado(LOCAL, undefined, e);
    expect(entrada.menuId).toBeUndefined();
    expect(entrada.precioCentimos).toBeNull();
    expect(entrada.horaInicio).toBeNull();
    expect(entrada.horaFin).toBeNull();
    expect(entrada.grupos.map((g) => g.items.length)).toEqual([0, 0, 0]);
    expect(entrada.grupos[0]).toEqual({ titulo: "Primeros", items: [] });
  });

  it("errores: precio mal escrito, sin días y horas al revés", () => {
    const e = estadoDesdeMenu(null);
    e.precio = "doce";
    e.dias = [];
    e.todoElDia = false;
    e.horaInicio = "16:00";
    e.horaFin = "13:00";
    const { errores } = validarEstadoMenu(LOCAL, undefined, e);
    expect(errores.precioCentimos).toBe("formato");
    expect(errores.dias).toBe("requerido");
    expect(errores.horaFin).toBe("fuera_de_rango");
  });

  it("error: falta una hora", () => {
    const e = estadoDesdeMenu(null);
    e.todoElDia = false;
    e.horaInicio = "13:00";
    expect(validarEstadoMenu(LOCAL, undefined, e).errores.horaFin).toBe("requerido");
  });
});
