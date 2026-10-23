// Cartas públicas de ejemplo para los tests de la carta (solo las importan archivos *.test.ts(x)).
// Nombres y precios de la carta de demostración «Cafetería La Guagua».

import { CARTA_DEMO } from "@/lib/demo/carta-demo";
import type { CartaPublica, LocalPublico, MenuPublico, PlatoPublico, SeccionPublica } from "@/lib/tipos/carta";

export function localPublicoEjemplo(cambios: Partial<LocalPublico> = {}): LocalPublico {
  return {
    id: "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c",
    slug: "la-guagua",
    nombre: "Cafetería La Guagua",
    descripcion: "Raciones, cazuelas y marisco de siempre",
    direccion: "Calle Mayor 1, Ciudad Real",
    telefono: "926 000 000",
    colorMarca: "#a63d12",
    horarios: [
      { dia: 1, abre: "08:00", cierra: "16:30" },
      { dia: 2, abre: "08:00", cierra: "16:30" },
    ],
    idiomaBase: "es",
    idiomasActivos: ["es"],
    traducciones: {},
    permitirIndexar: true,
    actualizadoEn: "2026-10-20T10:00:00+00:00",
    logoUrl: null,
    ...cambios,
  };
}

export function platoPublicoEjemplo(id: string, nombre: string, cambios: Partial<PlatoPublico> = {}): PlatoPublico {
  return {
    id,
    nombre,
    descripcion: null,
    precios: [{ id: "p001", formato: "unico", texto: null, centimos: 500 }],
    alergenos: [],
    trazas: [],
    alergenosConfirmados: true,
    etiquetas: [],
    orden: 0,
    agotado: false,
    traducciones: {},
    fotoUrl: null,
    ...cambios,
  };
}

export const BRAVAS = platoPublicoEjemplo("b0000001-0000-4000-8000-000000000001", "Patatas bravas", {
  descripcion: "Patatas fritas con salsa brava y alioli.",
  precios: [
    { id: "v001", formato: "media_racion", texto: null, centimos: 225 },
    { id: "v002", formato: "racion", texto: null, centimos: 375 },
  ],
  alergenos: ["huevos"],
  etiquetas: ["vegetariano", "picante"],
});

export const PULPO = platoPublicoEjemplo("b0000002-0000-4000-8000-000000000002", "Pulpo a la gallega", {
  descripcion: "Pulpo cocido sobre patata, con aceite y pimentón.",
  precios: [
    { id: "v001", formato: "racion_mediana", texto: null, centimos: 1000 },
    { id: "v002", formato: "racion_grande", texto: null, centimos: 1200 },
  ],
  alergenos: ["moluscos"],
  fotoUrl: "https://ejemplo.supabase.co/storage/v1/object/public/imagenes/x/platos/y/foto.webp",
});

export const GAMBA = platoPublicoEjemplo("b0000003-0000-4000-8000-000000000003", "Gamba roja a la plancha", {
  precios: [{ id: "v001", formato: "docena", texto: null, centimos: 1400 }],
  alergenos: ["crustaceos"],
  trazas: ["moluscos"],
});

export function cartaPublicaEjemplo(cambios: { local?: Partial<LocalPublico>; secciones?: SeccionPublica[]; menus?: MenuPublico[] } = {}): CartaPublica {
  return {
    local: localPublicoEjemplo(cambios.local),
    secciones: cambios.secciones ?? [
      { id: "s0000001-0000-4000-8000-000000000001", nombre: "Mariscos", descripcion: null, orden: 0, traducciones: {}, platos: [GAMBA, PULPO] },
      { id: "s0000002-0000-4000-8000-000000000002", nombre: "Tapas y raciones", descripcion: null, orden: 1, traducciones: {}, platos: [BRAVAS] },
    ],
    menus: cambios.menus ?? [],
  };
}

/** Lista de `n` platos sencillos (para probar el umbral de indexación). */
export function cartaConPlatos(n: number, permitirIndexar = true): CartaPublica {
  const platos = Array.from({ length: n }, (_, i) => platoPublicoEjemplo(`p${i}`, `Plato ${i + 1}`));
  return cartaPublicaEjemplo({
    local: { permitirIndexar },
    secciones: [{ id: "s1", nombre: "Tapas", descripcion: null, orden: 0, traducciones: {}, platos }],
  });
}

/** Traducción de prueba de un campo (origen automático salvo que se diga). */
export function traduccion(texto: string, origen: "auto" | "manual" = "auto") {
  return { texto, origen, huella: "0000000000000000", fecha: "2026-10-20T10:00:00+00:00" };
}

/**
 * Carta con `n` platos, todos los idiomas activos y `traducidos` de ellos con el nombre en inglés.
 * Sirve para probar el umbral del 90 % por idioma.
 */
export function cartaConTraducidos(n: number, traducidos: number, permitirIndexar = true): CartaPublica {
  const carta = cartaConPlatos(n, permitirIndexar);
  carta.local.idiomasActivos = ["es", "en", "fr", "de", "ca", "eu", "gl"];
  carta.secciones[0].platos = carta.secciones[0].platos.map((p, i) =>
    i < traducidos ? { ...p, traducciones: { en: { nombre: traduccion(`Dish ${i + 1}`) } } } : p,
  );
  return carta;
}

/** La carta de demostración completa como CartaPublica (para probar la vista entera sin base de datos). */
export function cartaDemoPublica(): CartaPublica {
  const { local, secciones, menu } = CARTA_DEMO;
  return {
    local: {
      id: "d0000000-0000-4000-8000-000000000000",
      slug: local.slug,
      nombre: local.nombre,
      descripcion: local.descripcion,
      direccion: local.direccion,
      telefono: local.telefono,
      colorMarca: local.colorMarca,
      horarios: local.horarios,
      idiomaBase: "es",
      idiomasActivos: ["es"],
      traducciones: {},
      permitirIndexar: local.permitirIndexar,
      actualizadoEn: "2026-10-20T10:00:00+00:00",
      logoUrl: null,
    },
    secciones: secciones.map((s, i) => ({
      id: `s${i}`,
      nombre: s.nombre,
      descripcion: s.descripcion,
      orden: i,
      traducciones: {},
      platos: s.platos.map((p, j) => ({
        id: `s${i}p${j}`,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precios: p.precios,
        alergenos: p.alergenos,
        trazas: p.trazas,
        alergenosConfirmados: true,
        etiquetas: p.etiquetas,
        orden: j,
        agotado: false,
        traducciones: {},
        fotoUrl: null,
      })),
    })),
    menus: [
      {
        id: "m0",
        nombre: menu.nombre,
        precioCentimos: menu.precioCentimos,
        dias: menu.dias,
        horaInicio: menu.horaInicio,
        horaFin: menu.horaFin,
        grupos: menu.grupos.map((g) => ({
          ...g,
          items: g.items.map((it) => ({ ...it, alergenosConfirmados: true })),
        })),
        notas: menu.notas,
        orden: 0,
        traducciones: {},
      },
    ],
  };
}
