import { describe, expect, it } from "vitest";
import { colorMarcaValido } from "@/lib/dominio/contraste";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import { COLORES_SUGERIDOS, evaluarColor } from "./color";

describe("COLORES_SUGERIDOS", () => {
  it("son 8, todos con contraste suficiente y con nombre", () => {
    expect(COLORES_SUGERIDOS).toHaveLength(8);
    for (const c of COLORES_SUGERIDOS) {
      expect(colorMarcaValido(c)).toBe(true);
      expect(panelLocalEs.local.color.nombres[c]).toBeTruthy();
    }
  });
});

describe("evaluarColor", () => {
  it("un color oscuro es válido", () => {
    expect(evaluarColor("#1d4f91")).toMatchObject({ valido: true });
  });
  it("un color claro no se puede guardar", () => {
    expect(evaluarColor("#ffe08a").valido).toBe(false);
  });
  it("normaliza a minúsculas", () => {
    expect(evaluarColor("#1D4F91").color).toBe("#1d4f91");
  });
  it("un formato raro no es válido", () => {
    expect(evaluarColor("rojo").valido).toBe(false);
  });
});
