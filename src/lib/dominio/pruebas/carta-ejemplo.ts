// Datos de ejemplo para los tests (sacados de la carta real de La Guagua, docs/datos/carta-la-guagua.md).
// Solo los importan archivos *.test.ts.

import type { CartaPanel, Local, Menu, Plato, Seccion } from "@/lib/tipos/carta";

export const LOCAL_ID = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";
export const SECCION_MARISCOS = "a1111111-1111-4111-8111-111111111111";
export const SECCION_CAZUELAS = "a2222222-2222-4222-8222-222222222222";
export const SECCION_OCULTA = "a3333333-3333-4333-8333-333333333333";
export const SECCION_VACIA = "a4444444-4444-4444-8444-444444444444";

export function localEjemplo(cambios: Partial<Local> = {}): Local {
  return {
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
    ...cambios,
  };
}

export function seccionEjemplo(id: string, nombre: string, orden: number, cambios: Partial<Seccion> = {}): Seccion {
  return { id, localId: LOCAL_ID, nombre, descripcion: null, orden, visible: true, traducciones: {}, ...cambios };
}

export function platoEjemplo(id: string, seccionId: string, nombre: string, orden: number, cambios: Partial<Plato> = {}): Plato {
  return {
    id,
    localId: LOCAL_ID,
    seccionId,
    nombre,
    descripcion: null,
    precios: [{ id: "p1a2", formato: "unico", texto: null, centimos: 500 }],
    alergenos: [],
    trazas: [],
    alergenosConfirmados: false,
    etiquetas: [],
    fotoRuta: null,
    orden,
    agotado: false,
    visible: true,
    traducciones: {},
    actualizadoEn: "2026-10-20T10:00:00+00:00",
    ...cambios,
  };
}

export function menuEjemplo(id: string, orden: number, cambios: Partial<Menu> = {}): Menu {
  return {
    id,
    localId: LOCAL_ID,
    nombre: "Menú del día",
    precioCentimos: 1200,
    dias: [1, 2, 3, 4, 5],
    horaInicio: "13:00",
    horaFin: "16:00",
    grupos: [{ id: "g1aa", titulo: "Primeros", items: [{ id: "i1aa", nombre: "Ensalada", alergenos: [], alergenosConfirmados: true }] }],
    notas: "Incluye pan y bebida",
    orden,
    visible: true,
    traducciones: {},
    ...cambios,
  };
}

/** Carta de panel con cosas ocultas, desordenadas y una sección vacía. */
export function cartaPanelEjemplo(): CartaPanel {
  const pulpo = platoEjemplo("b1111111-1111-4111-8111-111111111111", SECCION_MARISCOS, "Pulpo a la gallega", 2, {
    precios: [
      { id: "pm01", formato: "racion_mediana", texto: null, centimos: 1000 },
      { id: "pg01", formato: "racion_grande", texto: null, centimos: 1200 },
    ],
    alergenos: ["moluscos"],
    alergenosConfirmados: true,
    fotoRuta: `${LOCAL_ID}/platos/b1111111-1111-4111-8111-111111111111/ffff0000ffff0000.webp`,
  });
  const gamba = platoEjemplo("b2222222-2222-4222-8222-222222222222", SECCION_MARISCOS, "Gamba roja a la plancha", 1, {
    precios: [
      { id: "md01", formato: "media_docena", texto: null, centimos: 700 },
      { id: "dc01", formato: "docena", texto: null, centimos: 1400 },
    ],
    alergenos: ["crustaceos"],
    alergenosConfirmados: true,
    agotado: true,
  });
  const oculto = platoEjemplo("b3333333-3333-4333-8333-333333333333", SECCION_MARISCOS, "Plato oculto", 0, { visible: false });
  const cazuela = platoEjemplo("b4444444-4444-4444-8444-444444444444", SECCION_CAZUELAS, "Cazuela de gambas", 0);
  const enSeccionOculta = platoEjemplo("b5555555-5555-4555-8555-555555555555", SECCION_OCULTA, "En sección oculta", 0);
  const soloOculto = platoEjemplo("b6666666-6666-4666-8666-666666666666", SECCION_VACIA, "Solo oculto", 0, { visible: false });

  return {
    local: localEjemplo({ publicado: false }),
    acceso: { estado: "prueba", plan: "carta_resenas", activo: true, diasRestantes: 10, vigenteHasta: "2026-11-01T00:00:00Z" },
    secciones: [
      { ...seccionEjemplo(SECCION_CAZUELAS, "Cazuelas", 1), platos: [cazuela] },
      { ...seccionEjemplo(SECCION_MARISCOS, "Mariscos", 0), platos: [pulpo, gamba, oculto] },
      { ...seccionEjemplo(SECCION_OCULTA, "Oculta", 2, { visible: false }), platos: [enSeccionOculta] },
      { ...seccionEjemplo(SECCION_VACIA, "Vacía", 3), platos: [soloOculto] },
    ],
    menus: [
      menuEjemplo("c2222222-2222-4222-8222-222222222222", 1, { nombre: "Menú de fin de semana", dias: [6, 7] }),
      menuEjemplo("c1111111-1111-4111-8111-111111111111", 0),
      menuEjemplo("c3333333-3333-4333-8333-333333333333", 2, { visible: false }),
    ],
  };
}
