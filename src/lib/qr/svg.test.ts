import { describe, expect, it } from "vitest";
import { qrComoSvg } from "./svg";

const URL_PRUEBA = "https://kartana-six.vercel.app/c/demo";

describe("qrComoSvg", () => {
  const svg = qrComoSvg(URL_PRUEBA, { tamanoPx: 300, margenModulos: 4 });

  it("es un SVG con viewBox y tamaño", () => {
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("viewBox=");
    expect(svg).toContain('width="300"');
  });

  it("solo usa negro y blanco, con un único path", () => {
    const rellenos = [...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(rellenos)).toEqual(new Set(["#ffffff", "#000000"]));
    expect(svg.match(/<path/g)).toHaveLength(1);
  });

  it("no lleva scripts", () => {
    expect(svg.toLowerCase()).not.toContain("<script");
  });

  it("el viewBox suma el margen a cada lado", () => {
    const lado = Number(/viewBox="0 0 (\d+) \d+"/.exec(svg)?.[1]);
    expect((lado - 8 - 17) % 4).toBe(0); // 17 + 4*versión módulos, más 4 de margen a cada lado
  });
});
