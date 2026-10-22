import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { erroresPorCampo } from "./comun";
import { esquemaCrearLocal, esquemaHorarios, esquemaLocal, esquemaLogo, esquemaPublicar } from "./local";

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";
const OTRO = "00000000-0000-0000-0000-000000000001";

function errores(esquema: z.ZodType, valor: unknown) {
  const r = esquema.safeParse(valor);
  if (r.success) throw new Error("se esperaba un error");
  return erroresPorCampo(r.error);
}

const localValido = {
  localId: LOCAL,
  nombre: "  Bar Pepe ",
  slug: "bar-pepe",
  descripcion: "",
  direccion: "Calle Mayor 1",
  telefono: "+34 600 00 00 00",
  colorMarca: "#B9461A",
  permitirIndexar: true,
};

describe("esquemaCrearLocal", () => {
  it("acepta nombre y slug válidos", () => {
    expect(esquemaCrearLocal.parse({ nombre: " Bar Pepe ", slug: "bar-pepe" })).toEqual({ nombre: "Bar Pepe", slug: "bar-pepe" });
  });

  it("rechaza slug mal formado, reservado y nombre vacío o largo", () => {
    expect(errores(esquemaCrearLocal, { nombre: "", slug: "Bar Pepe" })).toEqual({ nombre: "requerido", slug: "formato" });
    expect(errores(esquemaCrearLocal, { nombre: "x".repeat(81), slug: "demo" })).toEqual({
      nombre: "demasiado_largo",
      slug: "reservado",
    });
  });
});

describe("esquemaLocal", () => {
  it("normaliza textos vacíos a null y el color a minúsculas", () => {
    const r = esquemaLocal.parse(localValido);
    expect(r.nombre).toBe("Bar Pepe");
    expect(r.descripcion).toBeNull();
    expect(r.colorMarca).toBe("#b9461a");
  });

  it("acepta los uuid fijos de la semilla", () => {
    expect(esquemaLocal.safeParse({ ...localValido, localId: OTRO }).success).toBe(true);
  });

  it("rechaza colores sin contraste o mal escritos", () => {
    expect(errores(esquemaLocal, { ...localValido, colorMarca: "#f5d000" })).toEqual({ colorMarca: "contraste" });
    expect(errores(esquemaLocal, { ...localValido, colorMarca: "rojo" })).toEqual({ colorMarca: "formato" });
  });

  it("rechaza teléfono raro, textos largos e id malo", () => {
    expect(
      errores(esquemaLocal, {
        ...localValido,
        localId: "abc",
        telefono: "llámame",
        direccion: "x".repeat(201),
        descripcion: "x".repeat(301),
      }),
    ).toEqual({ localId: "formato", telefono: "formato", direccion: "demasiado_largo", descripcion: "demasiado_largo" });
  });

  it("exige permitirIndexar booleano", () => {
    expect(errores(esquemaLocal, { ...localValido, permitirIndexar: undefined })).toEqual({ permitirIndexar: "requerido" });
  });
});

describe("esquemaHorarios", () => {
  const franja = (dia: number, abre = "13:00", cierra = "16:00") => ({ dia, abre, cierra });

  it("acepta franjas válidas, también las que cruzan la medianoche", () => {
    expect(esquemaHorarios.safeParse({ localId: LOCAL, horarios: [franja(1), franja(5, "20:00", "02:00")] }).success).toBe(true);
    expect(esquemaHorarios.safeParse({ localId: LOCAL, horarios: [] }).success).toBe(true);
  });

  it("rechaza día fuera de 1..7, horas mal escritas y franjas de duración cero", () => {
    expect(errores(esquemaHorarios, { localId: LOCAL, horarios: [franja(8)] })).toEqual({ "horarios.0.dia": "formato" });
    expect(errores(esquemaHorarios, { localId: LOCAL, horarios: [franja(1, "24:00")] })).toEqual({ "horarios.0.abre": "formato" });
    expect(errores(esquemaHorarios, { localId: LOCAL, horarios: [franja(1, "9:00")] })).toEqual({ "horarios.0.abre": "formato" });
    expect(errores(esquemaHorarios, { localId: LOCAL, horarios: [franja(1, "10:00", "10:00")] })).toEqual({
      "horarios.0.cierra": "formato",
    });
  });

  it("máximo 3 franjas por día", () => {
    const cuatro = [franja(1, "08:00", "09:00"), franja(1, "10:00", "11:00"), franja(1, "12:00", "13:00"), franja(1, "14:00", "15:00")];
    expect(errores(esquemaHorarios, { localId: LOCAL, horarios: cuatro })).toEqual({ "horarios.3.dia": "fuera_de_rango" });
  });
});

describe("esquemaLogo", () => {
  it("acepta una ruta dentro de la carpeta logo del local, o null", () => {
    expect(esquemaLogo.safeParse({ localId: LOCAL, logoRuta: `${LOCAL}/logo/abcd1234abcd1234.png` }).success).toBe(true);
    expect(esquemaLogo.safeParse({ localId: LOCAL, logoRuta: null }).success).toBe(true);
  });

  it("rechaza rutas de otro local o de otra carpeta", () => {
    expect(errores(esquemaLogo, { localId: LOCAL, logoRuta: `${OTRO}/logo/a.png` })).toEqual({ logoRuta: "formato" });
    expect(errores(esquemaLogo, { localId: LOCAL, logoRuta: `${LOCAL}/platos/a.png` })).toEqual({ logoRuta: "formato" });
    expect(errores(esquemaLogo, { localId: LOCAL, logoRuta: `${LOCAL}/logo/a.svg` })).toEqual({ logoRuta: "formato" });
  });
});

describe("esquemaPublicar", () => {
  it("valida id y booleano", () => {
    expect(esquemaPublicar.parse({ localId: LOCAL, publicado: true })).toEqual({ localId: LOCAL, publicado: true });
    expect(errores(esquemaPublicar, { localId: LOCAL, publicado: "sí" })).toEqual({ publicado: "requerido" });
  });
});
