import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALERGENOS } from "@/lib/dominio/alergenos";
import { MARCA_FIN, MARCA_INICIO, reglasFiltroAlergenos } from "./reglas-filtro";

describe("reglasFiltroAlergenos", () => {
  const css = reglasFiltroAlergenos();

  it("oculta los platos con cada uno de los 14 alérgenos marcados", () => {
    for (const c of ALERGENOS) {
      expect(css).toContain(`.carta:has(#f-${c}:checked) .plato[data-alergenos~="${c}"]`);
    }
  });

  it("con «trazas» marcada, oculta también los que pueden contener trazas", () => {
    expect(css).toContain('.carta:has(#f-trazas:checked):has(#f-gluten:checked) .plato[data-trazas~="gluten"]');
    for (const c of ALERGENOS) expect(css).toContain(`.plato[data-trazas~="${c}"]`);
  });

  it("muestra «sin información» en los platos sin confirmar cuando hay un filtro activo", () => {
    expect(css).toContain(
      '.carta:has(.filtro input[name="al"]:checked) .plato[data-confirmado="no"] .sin-info {\n  display: block;\n}',
    );
  });

  it("empieza y acaba con las marcas", () => {
    expect(css.startsWith(MARCA_INICIO)).toBe(true);
    expect(css.endsWith(MARCA_FIN)).toBe(true);
  });

  it("carta.css lleva exactamente las reglas generadas", () => {
    const archivo = readFileSync(path.resolve(__dirname, "../../app/(carta)/carta.css"), "utf8").replace(/\r\n/g, "\n");
    const inicio = archivo.indexOf(MARCA_INICIO);
    const fin = archivo.indexOf(MARCA_FIN);
    expect(inicio).toBeGreaterThanOrEqual(0);
    expect(fin).toBeGreaterThan(inicio);
    expect(archivo.slice(inicio, fin + MARCA_FIN.length)).toBe(css);
  });
});
