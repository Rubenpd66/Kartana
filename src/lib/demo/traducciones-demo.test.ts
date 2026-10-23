import { describe, expect, it } from "vitest";
import { LIMITES, LIMITES_EXTRA } from "@/lib/dominio/limites";
import { CARTA_DEMO, todosLosPlatosDemo } from "./carta-demo";
import { IDIOMAS_DESTINO_DEMO, TRADUCCIONES_DEMO } from "./traducciones-demo";

const T = TRADUCCIONES_DEMO;

function noVacio(texto: string) {
  expect(texto.trim()).not.toBe("");
  expect(texto).toBe(texto.trim());
}

describe("traducciones de la demo: cobertura", () => {
  it("cubre los 6 idiomas de destino", () => {
    expect([...IDIOMAS_DESTINO_DEMO].sort()).toEqual(["ca", "de", "en", "eu", "fr", "gl"]);
  });

  it("hay traducción de cada plato de la demo, y no sobra ninguna", () => {
    const originales = todosLosPlatosDemo().map((p) => p.nombre);
    expect(new Set(originales).size).toBe(originales.length); // los nombres son únicos: la semilla los usa como clave
    expect(Object.keys(T.platos).sort()).toEqual([...originales].sort());
  });

  it("hay traducción de cada sección y de cada título de grupo del menú", () => {
    expect(Object.keys(T.secciones).sort()).toEqual(CARTA_DEMO.secciones.map((s) => s.nombre).sort());
    expect(Object.keys(T.menu.grupos).sort()).toEqual(CARTA_DEMO.menu.grupos.map((g) => g.titulo).sort());
  });

  it("hay traducción de cada etiqueta libre de precio", () => {
    const libres = new Set(
      todosLosPlatosDemo().flatMap((p) => p.precios.filter((v) => v.formato === "otro").map((v) => v.texto as string)),
    );
    expect(Object.keys(T.formatosLibres).sort()).toEqual([...libres].sort());
  });

  it("los ítems del menú son platos de la carta (así se reutilizan sus nombres)", () => {
    for (const g of CARTA_DEMO.menu.grupos) for (const i of g.items) expect(T.platos[i.nombre]).toBeDefined();
  });

  it("las secciones de la demo no tienen descripción que traducir", () => {
    for (const s of CARTA_DEMO.secciones) expect(s.descripcion).toBeNull();
  });
});

describe("traducciones de la demo: calidad y límites", () => {
  it("ningún texto está vacío ni lleva espacios sobrantes", () => {
    for (const idioma of IDIOMAS_DESTINO_DEMO) {
      noVacio(T.local[idioma]);
      noVacio(T.menu.nombre[idioma]);
      noVacio(T.menu.notas[idioma]);
      for (const v of Object.values(T.secciones)) noVacio(v[idioma]);
      for (const v of Object.values(T.menu.grupos)) noVacio(v[idioma]);
      for (const v of Object.values(T.formatosLibres)) noVacio(v[idioma]);
      for (const v of Object.values(T.platos)) {
        noVacio(v[idioma][0]);
        noVacio(v[idioma][1]);
      }
    }
  });

  it("respeta la longitud máxima de cada campo", () => {
    for (const idioma of IDIOMAS_DESTINO_DEMO) {
      expect(T.local[idioma].length).toBeLessThanOrEqual(LIMITES.descripcionLocal);
      expect(T.menu.nombre[idioma].length).toBeLessThanOrEqual(LIMITES_EXTRA.nombreMenu);
      expect(T.menu.notas[idioma].length).toBeLessThanOrEqual(LIMITES_EXTRA.notasMenu);
      for (const v of Object.values(T.secciones)) expect(v[idioma].length).toBeLessThanOrEqual(LIMITES.nombreSeccion);
      for (const v of Object.values(T.menu.grupos)) expect(v[idioma].length).toBeLessThanOrEqual(LIMITES_EXTRA.tituloGrupo);
      for (const v of Object.values(T.formatosLibres)) expect(v[idioma].length).toBeLessThanOrEqual(LIMITES.textoFormatoLibre);
      for (const [es, v] of Object.entries(T.platos)) {
        expect(v[idioma][0].length, `${idioma} · nombre de «${es}»`).toBeLessThanOrEqual(LIMITES.nombrePlato);
        expect(v[idioma][0].length, `${idioma} · nombre de «${es}» (ítem de menú)`).toBeLessThanOrEqual(LIMITES_EXTRA.nombreItem);
        expect(v[idioma][1].length, `${idioma} · descripción de «${es}»`).toBeLessThanOrEqual(LIMITES.descripcionPlato);
      }
    }
  });

  it("no deja el texto en español sin traducir en inglés (salvo nombres propios)", () => {
    const iguales = Object.entries(T.platos)
      .filter(([es, v]) => v.en[1] === CARTA_DEMO.secciones.flatMap((s) => s.platos).find((p) => p.nombre === es)?.descripcion)
      .map(([es]) => es);
    expect(iguales).toEqual([]);
  });
});
