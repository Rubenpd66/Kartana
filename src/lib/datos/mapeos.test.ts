import { describe, expect, it } from "vitest";
import {
  contenidoDeGrupos,
  filaAAcceso,
  filaALocal,
  filaAMenu,
  filaAPlato,
  filaASeccion,
  horaCorta,
  preciosDeFila,
} from "./mapeos";
import { filaAcceso, filaLocal, filaMenu, filaPlato, filaSeccion, LOCAL_ID, PLATO_ID, SECCION_ID } from "./pruebas/filas-ejemplo";

describe("filaALocal", () => {
  it("convierte snake_case a camelCase", () => {
    const local = filaALocal(filaLocal());
    expect(local).toEqual({
      id: LOCAL_ID,
      slug: "la-guagua",
      nombre: "Cafetería La Guagua",
      descripcion: "Mariscos y tapas",
      direccion: "Calle Mayor 1",
      telefono: "600 000 000",
      logoRuta: `${LOCAL_ID}/logo/abcd1234abcd1234.png`,
      colorMarca: "#b9461a",
      horarios: [{ dia: 1, abre: "12:00", cierra: "16:00" }],
      idiomaBase: "es",
      idiomasActivos: ["es"],
      traducciones: {},
      publicado: true,
      permitirIndexar: true,
      creadoEn: "2026-10-01T10:00:00+00:00",
      actualizadoEn: "2026-10-20T10:00:00+00:00",
    });
  });

  it("tolera jsonb raro y filtra idiomas desconocidos", () => {
    const local = filaALocal(filaLocal({ horarios: null, traducciones: [], idiomas_activos: ["es", "xx", "en"] }));
    expect(local.horarios).toEqual([]);
    expect(local.traducciones).toEqual({});
    expect(local.idiomasActivos).toEqual(["es", "en"]);
  });

  it("acepta la fila pública (sin dueno_id ni creado_en)", () => {
    const { dueno_id: _d, creado_en: _c, ...publica } = filaLocal();
    void _d;
    void _c;
    expect(filaALocal(publica).creadoEn).toBe("2026-10-20T10:00:00+00:00");
  });
});

describe("filaASeccion", () => {
  it("convierte la sección", () => {
    expect(filaASeccion(filaSeccion({ descripcion: "Del día" }))).toEqual({
      id: SECCION_ID,
      localId: LOCAL_ID,
      nombre: "Mariscos",
      descripcion: "Del día",
      orden: 0,
      visible: true,
      traducciones: {},
    });
  });
});

describe("filaAPlato", () => {
  it("convierte el plato con sus variantes", () => {
    expect(filaAPlato(filaPlato())).toEqual({
      id: PLATO_ID,
      localId: LOCAL_ID,
      seccionId: SECCION_ID,
      nombre: "Pulpo a la gallega",
      descripcion: "Con cachelos",
      precios: [
        { id: "pm01", formato: "racion_mediana", texto: null, centimos: 1000 },
        { id: "pg01", formato: "racion_grande", texto: null, centimos: 1200 },
      ],
      alergenos: ["moluscos"],
      trazas: [],
      alergenosConfirmados: true,
      etiquetas: ["recomendado"],
      fotoRuta: null,
      orden: 0,
      agotado: false,
      visible: true,
      traducciones: {},
      actualizadoEn: "2026-10-02T10:00:00+00:00",
    });
  });

  it("filtra códigos desconocidos", () => {
    const plato = filaAPlato(filaPlato({ alergenos: ["moluscos", "tomate"], etiquetas: ["barato"] }));
    expect(plato.alergenos).toEqual(["moluscos"]);
    expect(plato.etiquetas).toEqual([]);
  });
});

describe("preciosDeFila", () => {
  it("rellena texto ausente y descarta lo que no es una variante", () => {
    expect(preciosDeFila([{ id: "u001", formato: "unico", centimos: 850 }])).toEqual([
      { id: "u001", formato: "unico", texto: null, centimos: 850 },
    ]);
    expect(preciosDeFila(null)).toEqual([]);
    expect(preciosDeFila([{ id: "x", formato: "kilo", centimos: 1 }, "basura"])).toEqual([]);
  });
});

describe("filaAMenu y contenidoDeGrupos", () => {
  it("convierte horas, días y grupos", () => {
    expect(filaAMenu(filaMenu())).toEqual({
      id: "c1111111-1111-4111-8111-111111111111",
      localId: LOCAL_ID,
      nombre: "Menú del día",
      precioCentimos: 1200,
      dias: [1, 2, 3, 4, 5],
      horaInicio: "13:00",
      horaFin: "16:00",
      grupos: [{ id: "gr01", titulo: "Primeros", items: [{ id: "it01", nombre: "Lentejas", alergenos: ["apio"], alergenosConfirmados: true }] }],
      notas: "Incluye pan y bebida",
      orden: 0,
      visible: true,
      traducciones: {},
    });
  });

  it("sin horas: null", () => {
    const menu = filaAMenu(filaMenu({ hora_inicio: null, hora_fin: null }));
    expect(menu.horaInicio).toBeNull();
    expect(menu.horaFin).toBeNull();
  });

  it("contenidoDeGrupos es la inversa (claves snake_case para la base de datos)", () => {
    const menu = filaAMenu(filaMenu());
    expect(contenidoDeGrupos(menu.grupos)).toEqual(filaMenu().contenido);
  });

  it("horaCorta", () => {
    expect(horaCorta("09:30:00")).toBe("09:30");
    expect(horaCorta("09:30")).toBe("09:30");
    expect(horaCorta(null)).toBeNull();
  });
});

describe("filaAAcceso", () => {
  it("convierte el acceso", () => {
    expect(filaAAcceso(filaAcceso())).toEqual({
      localId: LOCAL_ID,
      estado: "prueba",
      plan: "carta_resenas",
      vigenteHasta: "2030-01-01T00:00:00+00:00",
      notas: null,
      actualizadoEn: "2026-10-01T10:00:00+00:00",
    });
  });
});
