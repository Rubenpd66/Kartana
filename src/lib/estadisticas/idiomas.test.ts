import { describe, expect, it } from "vitest";
import { calcularIdiomas } from "./idiomas";

const dia = (visitasPorIdioma: Record<string, number>) => ({ dia: "2026-10-01", visitas: 0, clicsResena: 0, visitasPorIdioma });

describe("calcularIdiomas", () => {
  it("suma días, ordena y da porcentajes", () => {
    const r = calcularIdiomas([dia({ es: 6, en: 1 }), dia({ es: 1, fr: 2 })]);
    expect(r.map((f) => f.idioma)).toEqual(["es", "fr", "en"]);
    expect(r[0]).toEqual({ idioma: "es", visitas: 7, porcentaje: 70 });
  });
  it("sin datos: lista vacía", () => expect(calcularIdiomas([dia({})])).toEqual([]));
});
