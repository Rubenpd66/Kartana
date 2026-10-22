import { describe, expect, it } from "vitest";
import { convertirACartaPublica } from "./carta";
import { cartaPanelEjemplo, LOCAL_ID } from "./pruebas/carta-ejemplo";

const url = (ruta: string) => `https://cdn.test/${ruta}`;

describe("convertirACartaPublica", () => {
  const publica = convertirACartaPublica(cartaPanelEjemplo(), url);

  it("ordena las secciones y quita las ocultas y las vacías", () => {
    expect(publica.secciones.map((s) => s.nombre)).toEqual(["Mariscos", "Cazuelas"]);
  });

  it("quita los platos ocultos, ordena por orden y mantiene los agotados", () => {
    const mariscos = publica.secciones[0];
    expect(mariscos.platos.map((p) => p.nombre)).toEqual(["Gamba roja a la plancha", "Pulpo a la gallega"]);
    expect(mariscos.platos[0].agotado).toBe(true);
  });

  it("no expone campos internos de platos ni secciones", () => {
    const plato = publica.secciones[0].platos[1] as Record<string, unknown>;
    for (const campo of ["localId", "seccionId", "fotoRuta", "visible", "actualizadoEn"]) {
      expect(plato).not.toHaveProperty(campo);
    }
    expect(plato.fotoUrl).toBe(`https://cdn.test/${LOCAL_ID}/platos/b1111111-1111-4111-8111-111111111111/ffff0000ffff0000.webp`);
    expect(publica.secciones[0].platos[0].fotoUrl).toBeNull();
    const seccion = publica.secciones[0] as Record<string, unknown>;
    expect(seccion).not.toHaveProperty("localId");
    expect(seccion).not.toHaveProperty("visible");
  });

  it("convierte el local con la URL del logo y sin datos internos", () => {
    expect(publica.local.logoUrl).toBe(`https://cdn.test/${LOCAL_ID}/logo/abcd1234abcd1234.png`);
    const local = publica.local as Record<string, unknown>;
    for (const campo of ["logoRuta", "publicado", "creadoEn"]) {
      expect(local).not.toHaveProperty(campo);
    }
    expect(publica.local.slug).toBe("la-guagua");
  });

  it("logo null si no hay", () => {
    const carta = cartaPanelEjemplo();
    carta.local.logoRuta = null;
    expect(convertirACartaPublica(carta, url).local.logoUrl).toBeNull();
  });

  it("solo menús visibles, ordenados y sin campos internos", () => {
    expect(publica.menus.map((m) => m.nombre)).toEqual(["Menú del día", "Menú de fin de semana"]);
    const menu = publica.menus[0] as Record<string, unknown>;
    expect(menu).not.toHaveProperty("localId");
    expect(menu).not.toHaveProperty("visible");
  });

  it("no modifica la carta de entrada", () => {
    const carta = cartaPanelEjemplo();
    const copia = structuredClone(carta);
    convertirACartaPublica(carta, url);
    expect(carta).toEqual(copia);
  });
});
