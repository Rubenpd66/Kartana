// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GraficoVisitas } from "./GraficoVisitas";

const DIAS = [
  { dia: "2026-10-01", visitas: 0 },
  { dia: "2026-10-02", visitas: 5 },
  { dia: "2026-10-03", visitas: 2 },
];

afterEach(cleanup);

describe("GraficoVisitas", () => {
  it("es una imagen con título y descripción, y trae la tabla de números", () => {
    const { container } = render(<GraficoVisitas dias={DIAS} />);
    const img = screen.getByRole("img", { name: /^Visitas por día/ });
    expect(img.getAttribute("aria-labelledby")).toBe("grafico-titulo grafico-desc");
    expect(container.querySelector("desc")?.textContent).toContain("En total, 7");
    expect(container.querySelectorAll("rect")).toHaveLength(3);
    const tabla = screen.getByRole("table", { hidden: true });
    expect(within(tabla).getAllByRole("row", { hidden: true })).toHaveLength(4);
    expect(screen.getByText("Ver los números")).toBeTruthy();
  });
  it("sin visitas avisa con un texto", () => {
    render(<GraficoVisitas dias={DIAS.map((d) => ({ ...d, visitas: 0 }))} />);
    expect(screen.getByText(/Aún no hay visitas/)).toBeTruthy();
  });
});
