import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { erroresPorCampo } from "./comun";
import { esquemaMenu } from "./menu";

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";

function errores(esquema: z.ZodType, valor: unknown) {
  const r = esquema.safeParse(valor);
  if (r.success) throw new Error("se esperaba un error");
  return erroresPorCampo(r.error);
}

const menu = {
  localId: LOCAL,
  nombre: "Menú del día",
  precioCentimos: 1200,
  dias: [1, 2, 3, 4, 5],
  horaInicio: "13:00",
  horaFin: "16:00",
  grupos: [
    {
      titulo: "Primeros",
      items: [
        { nombre: "Ensalada mixta", alergenos: [], alergenosConfirmados: true },
        { id: "it01", nombre: "Lentejas", alergenos: ["apio"], alergenosConfirmados: true },
      ],
    },
    { id: "gr01", titulo: "Postres", items: [{ nombre: "Flan", alergenos: ["huevos", "lacteos"], alergenosConfirmados: false }] },
  ],
  notas: "Incluye pan, bebida y postre o café",
  visible: true,
};

describe("esquemaMenu", () => {
  it("acepta un menú del día completo (grupos e ítems nuevos sin id)", () => {
    const r = esquemaMenu.parse(menu);
    expect(r.grupos[0].id).toBeUndefined();
    expect(r.grupos[1].id).toBe("gr01");
  });

  it("acepta todo el día (sin horas) y sin precio", () => {
    expect(esquemaMenu.safeParse({ ...menu, horaInicio: null, horaFin: null, precioCentimos: null }).success).toBe(true);
  });

  it("las horas van las dos o ninguna, y inicio antes que fin", () => {
    expect(errores(esquemaMenu, { ...menu, horaFin: null })).toEqual({ horaFin: "requerido" });
    expect(errores(esquemaMenu, { ...menu, horaInicio: "17:00" })).toEqual({ horaFin: "fuera_de_rango" });
  });

  it("días: al menos uno, de 1 a 7 y sin repetir", () => {
    expect(errores(esquemaMenu, { ...menu, dias: [] })).toEqual({ dias: "requerido" });
    expect(errores(esquemaMenu, { ...menu, dias: [0] })).toEqual({ "dias.0": "formato" });
    expect(errores(esquemaMenu, { ...menu, dias: [1, 1] })).toEqual({ "dias.1": "duplicado" });
  });

  it("límites de grupos, ítems y textos", () => {
    const grupo = { titulo: "G", items: [] };
    expect(errores(esquemaMenu, { ...menu, grupos: Array(7).fill(grupo) })).toEqual({ grupos: "demasiado_largo" });
    const item = { nombre: "x", alergenos: [], alergenosConfirmados: false };
    expect(errores(esquemaMenu, { ...menu, grupos: [{ titulo: "G", items: Array(13).fill(item) }] })).toEqual({
      "grupos.0.items": "demasiado_largo",
    });
    expect(errores(esquemaMenu, { ...menu, nombre: "", notas: "x".repeat(201) })).toEqual({ nombre: "requerido", notas: "demasiado_largo" });
    expect(errores(esquemaMenu, { ...menu, grupos: [{ titulo: "x".repeat(41), items: [] }] })).toEqual({
      "grupos.0.titulo": "demasiado_largo",
    });
  });

  it("ids de grupos e ítems sin repetir", () => {
    expect(
      errores(esquemaMenu, {
        ...menu,
        grupos: [
          { id: "gr01", titulo: "A", items: [] },
          { id: "gr01", titulo: "B", items: [] },
        ],
      }),
    ).toEqual({ "grupos.1.id": "duplicado" });
  });

  it("precio fuera de rango", () => {
    expect(errores(esquemaMenu, { ...menu, precioCentimos: 100001 })).toEqual({ precioCentimos: "fuera_de_rango" });
  });
});
