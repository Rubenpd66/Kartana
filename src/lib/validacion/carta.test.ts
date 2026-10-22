import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { erroresPorCampo } from "./comun";
import { esquemaAgotado, esquemaOrden, esquemaPlato, esquemaSeccion } from "./carta";

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";
const SECCION = "a1111111-1111-4111-8111-111111111111";
const PLATO = "b1111111-1111-4111-8111-111111111111";
const OTRO = "c1111111-1111-4111-8111-111111111111";

function errores(esquema: z.ZodType, valor: unknown) {
  const r = esquema.safeParse(valor);
  if (r.success) throw new Error("se esperaba un error");
  return erroresPorCampo(r.error);
}

const plato = {
  localId: LOCAL,
  platoId: PLATO,
  esNuevo: true,
  seccionId: SECCION,
  nombre: "Pulpo a la gallega",
  descripcion: "Con cachelos",
  precios: [
    { formato: "racion_mediana", texto: null, centimos: 1000 },
    { formato: "racion_grande", texto: null, centimos: 1200 },
  ],
  alergenos: ["moluscos"],
  trazas: [],
  alergenosConfirmados: true,
  etiquetas: ["recomendado"],
  fotoRuta: `${LOCAL}/platos/${PLATO}/ffff0000ffff0000.webp`,
  visible: true,
};

describe("esquemaSeccion", () => {
  it("acepta crear (sin id) y editar (con id)", () => {
    expect(esquemaSeccion.parse({ localId: LOCAL, nombre: " Mariscos ", descripcion: "", visible: true })).toEqual({
      localId: LOCAL,
      nombre: "Mariscos",
      descripcion: null,
      visible: true,
    });
    expect(esquemaSeccion.safeParse({ localId: LOCAL, seccionId: SECCION, nombre: "Mariscos", descripcion: null, visible: false }).success).toBe(true);
  });

  it("rechaza nombre vacío o largo y descripción larga", () => {
    expect(errores(esquemaSeccion, { localId: LOCAL, nombre: "", descripcion: "x".repeat(201), visible: true })).toEqual({
      nombre: "requerido",
      descripcion: "demasiado_largo",
    });
    expect(errores(esquemaSeccion, { localId: LOCAL, nombre: "x".repeat(61), descripcion: null, visible: true })).toEqual({
      nombre: "demasiado_largo",
    });
  });
});

describe("esquemaPlato", () => {
  it("acepta media ración + ración", () => {
    const r = esquemaPlato.safeParse({
      ...plato,
      precios: [
        { formato: "media_racion", texto: null, centimos: 700 },
        { formato: "racion", texto: null, centimos: 950 },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("acepta un solo precio único y «según mercado»", () => {
    expect(esquemaPlato.safeParse({ ...plato, precios: [{ formato: "unico", texto: null, centimos: 850 }] }).success).toBe(true);
    expect(esquemaPlato.safeParse({ ...plato, precios: [{ formato: "unico", texto: null, centimos: null }] }).success).toBe(true);
  });

  it("rechaza las variantes mal formadas con la ruta del campo", () => {
    expect(errores(esquemaPlato, { ...plato, precios: [{ formato: "otro", texto: null, centimos: 100 }] })).toEqual({
      "precios.0.texto": "requerido",
    });
    expect(
      errores(esquemaPlato, {
        ...plato,
        precios: [
          { formato: "unico", texto: null, centimos: 100 },
          { formato: "tapa", texto: null, centimos: 100 },
        ],
      }),
    ).toEqual({ "precios.0.formato": "formato" });
    expect(errores(esquemaPlato, { ...plato, precios: [{ formato: "racion", texto: null, centimos: -1 }] })).toEqual({
      "precios.0.centimos": "fuera_de_rango",
    });
    expect(errores(esquemaPlato, { ...plato, precios: [{ formato: "racion", texto: null, centimos: 9.99 }] })).toEqual({
      "precios.0.centimos": "formato",
    });
  });

  it("sin platoId es válido solo si no hay foto", () => {
    const { platoId: _sinId, ...sinId } = plato;
    void _sinId;
    expect(esquemaPlato.safeParse({ ...sinId, fotoRuta: null }).success).toBe(true);
    expect(errores(esquemaPlato, sinId)).toEqual({ fotoRuta: "formato" });
  });

  it("la foto debe estar en la carpeta del local y del plato", () => {
    expect(errores(esquemaPlato, { ...plato, fotoRuta: `${LOCAL}/platos/${OTRO}/a.webp` })).toEqual({ fotoRuta: "formato" });
    expect(errores(esquemaPlato, { ...plato, fotoRuta: `${OTRO}/platos/${PLATO}/a.webp` })).toEqual({ fotoRuta: "formato" });
    expect(errores(esquemaPlato, { ...plato, fotoRuta: `${LOCAL}/logo/a.webp` })).toEqual({ fotoRuta: "formato" });
  });

  it("rechaza alérgenos, trazas y etiquetas desconocidos o repetidos", () => {
    expect(
      errores(esquemaPlato, { ...plato, alergenos: ["moluscos", "moluscos"], trazas: ["tomate"], etiquetas: ["barato"] }),
    ).toEqual({ "alergenos.1": "duplicado", "trazas.0": "formato", "etiquetas.0": "formato" });
  });

  it("exige esNuevo y nombre", () => {
    expect(errores(esquemaPlato, { ...plato, esNuevo: undefined, nombre: " " })).toEqual({ esNuevo: "requerido", nombre: "requerido" });
  });
});

describe("esquemaAgotado", () => {
  it("valida ids y booleano", () => {
    expect(esquemaAgotado.safeParse({ localId: LOCAL, platoId: PLATO, agotado: true }).success).toBe(true);
    expect(errores(esquemaAgotado, { localId: LOCAL, platoId: "x", agotado: 1 })).toEqual({ platoId: "formato", agotado: "requerido" });
  });
});

describe("esquemaOrden", () => {
  it("acepta una lista de ids de una tabla ordenable", () => {
    expect(esquemaOrden.safeParse({ localId: LOCAL, tabla: "platos", ids: [PLATO, OTRO] }).success).toBe(true);
  });

  it("rechaza tabla desconocida, lista vacía, repetidos y más de 200", () => {
    expect(errores(esquemaOrden, { localId: LOCAL, tabla: "locales", ids: [] })).toEqual({ tabla: "formato", ids: "requerido" });
    expect(errores(esquemaOrden, { localId: LOCAL, tabla: "menus", ids: [PLATO, PLATO] })).toEqual({ "ids.1": "duplicado" });
    const muchos = Array.from({ length: 201 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    expect(errores(esquemaOrden, { localId: LOCAL, tabla: "secciones", ids: muchos })).toEqual({ ids: "demasiado_largo" });
  });
});
