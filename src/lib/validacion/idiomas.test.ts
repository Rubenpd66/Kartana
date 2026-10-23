import { describe, expect, it } from "vitest";
import {
  campoTraducibleValido,
  esquemaDescartarTraduccion,
  esquemaEventoEstadistica,
  esquemaIdiomas,
  esquemaTraduccionManual,
  TEXTO_TRADUCIDO_MAX,
} from "./idiomas";

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";
const PLATO = "b1111111-1111-4111-8111-111111111111";

describe("esquemaIdiomas", () => {
  it("acepta idiomas de la carta, añade «es» y ordena como IDIOMAS_CARTA", () => {
    const r = esquemaIdiomas.safeParse({ localId: LOCAL, idiomas: ["gl", "en"] });
    expect(r.success && r.data).toEqual({ localId: LOCAL, idiomas: ["es", "en", "gl"] });
  });

  it("rechaza idiomas desconocidos, repetidos y un localId que no es uuid", () => {
    expect(esquemaIdiomas.safeParse({ localId: LOCAL, idiomas: ["es", "it"] }).success).toBe(false);
    expect(esquemaIdiomas.safeParse({ localId: LOCAL, idiomas: ["en", "en"] }).success).toBe(false);
    expect(esquemaIdiomas.safeParse({ localId: "1", idiomas: ["es"] }).success).toBe(false);
  });
});

describe("campoTraducibleValido", () => {
  it.each([
    ["locales", "descripcion", true],
    ["locales", "nombre", false],
    ["secciones", "nombre", true],
    ["secciones", "descripcion", true],
    ["secciones", "notas", false],
    ["platos", "nombre", true],
    ["platos", "precio.ot01.texto", true],
    ["platos", "precio.OT-1.texto", false],
    ["platos", "grupo.gr01.titulo", false],
    ["menus", "notas", true],
    ["menus", "grupo.gr01.titulo", true],
    ["menus", "item.it01.nombre", true],
    ["menus", "item.it01.titulo", false],
    ["menus", "descripcion", false],
  ] as const)("%s.%s -> %s", (tabla, campo, esperado) => {
    expect(campoTraducibleValido(tabla, campo)).toBe(esperado);
  });
});

describe("esquemaTraduccionManual", () => {
  const base = { localId: LOCAL, tabla: "platos", filaId: PLATO, campo: "nombre", idioma: "en", texto: "  Galician octopus " };

  it("acepta una corrección válida y recorta espacios", () => {
    const r = esquemaTraduccionManual.safeParse(base);
    expect(r.success && r.data.texto).toBe("Galician octopus");
  });

  it("rechaza el idioma base, tablas fuera de la lista y campos que no son de la tabla", () => {
    expect(esquemaTraduccionManual.safeParse({ ...base, idioma: "es" }).success).toBe(false);
    expect(esquemaTraduccionManual.safeParse({ ...base, tabla: "perfiles" }).success).toBe(false);
    const r = esquemaTraduccionManual.safeParse({ ...base, campo: "grupo.gr01.titulo" });
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0].path).toEqual(["campo"]);
  });

  it("rechaza textos vacíos o demasiado largos", () => {
    expect(esquemaTraduccionManual.safeParse({ ...base, texto: "   " }).success).toBe(false);
    expect(esquemaTraduccionManual.safeParse({ ...base, texto: "x".repeat(TEXTO_TRADUCIDO_MAX + 1) }).success).toBe(false);
  });

  it("descartar no lleva texto pero comprueba lo demás", () => {
    const { texto: _t, ...sinTexto } = base;
    void _t;
    expect(esquemaDescartarTraduccion.safeParse(sinTexto).success).toBe(true);
    expect(esquemaDescartarTraduccion.safeParse({ ...sinTexto, campo: "dueno_id" }).success).toBe(false);
  });
});

describe("esquemaEventoEstadistica", () => {
  it("acepta una visita con platos vacíos", () => {
    expect(esquemaEventoEstadistica.safeParse({ tipo: "visita", localId: LOCAL, idioma: "fr", platos: [] }).success).toBe(true);
  });

  it("quita ids repetidos de un lote de vistas", () => {
    const r = esquemaEventoEstadistica.safeParse({ tipo: "vistas", localId: LOCAL, idioma: "es", platos: [PLATO, PLATO] });
    expect(r.success && r.data.platos).toEqual([PLATO]);
  });

  it("rechaza más de 100 platos, ids que no son uuid, tipos e idiomas desconocidos", () => {
    const ids = Array.from({ length: 101 }, (_, i) => `b1111111-1111-4111-8111-${String(i).padStart(12, "0")}`);
    expect(esquemaEventoEstadistica.safeParse({ tipo: "vistas", localId: LOCAL, idioma: "es", platos: ids }).success).toBe(false);
    expect(esquemaEventoEstadistica.safeParse({ tipo: "vistas", localId: LOCAL, idioma: "es", platos: ["1"] }).success).toBe(false);
    expect(esquemaEventoEstadistica.safeParse({ tipo: "resena", localId: LOCAL, idioma: "es", platos: [] }).success).toBe(false);
    expect(esquemaEventoEstadistica.safeParse({ tipo: "visita", localId: LOCAL, idioma: "it", platos: [] }).success).toBe(false);
    expect(esquemaEventoEstadistica.safeParse({ tipo: "visita", localId: "x", idioma: "es", platos: [] }).success).toBe(false);
  });

  it("acepta justo 100 platos", () => {
    const ids = Array.from({ length: 100 }, (_, i) => `b1111111-1111-4111-8111-${String(i).padStart(12, "0")}`);
    expect(esquemaEventoEstadistica.safeParse({ tipo: "vistas", localId: LOCAL, idioma: "es", platos: ids }).success).toBe(true);
  });
});
