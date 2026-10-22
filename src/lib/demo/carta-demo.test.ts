import { describe, expect, it } from "vitest";
import { CARTA_DEMO, todosLosPlatosDemo } from "./carta-demo";

// Límites del modelo de datos (docs/arquitectura.md §3). Se repiten aquí a propósito:
// este test es la segunda barrera antes de ejecutar la semilla como `postgres` (sin RLS).
const L = {
  nombreLocal: 80,
  descripcionLocal: 300,
  nombreSeccion: 60,
  descripcionSeccion: 200,
  nombrePlato: 80,
  descripcionPlato: 300,
  descripcionPlatoDemo: 120,
  textoFormatoLibre: 30,
  centimosMax: 100000,
  seccionesPorLocal: 40,
  platosPorLocal: 400,
  tituloGrupo: 40,
  gruposPorMenu: 6,
  itemsPorGrupo: 12,
  notasMenu: 200,
  nombreMenu: 60,
};

const ALERGENOS = [
  "gluten",
  "crustaceos",
  "huevos",
  "pescado",
  "cacahuetes",
  "soja",
  "lacteos",
  "frutos_cascara",
  "apio",
  "mostaza",
  "sesamo",
  "sulfitos",
  "altramuces",
  "moluscos",
];
const ETIQUETAS = ["vegano", "vegetariano", "sin_gluten", "sin_lactosa", "picante", "casero", "recomendado", "nuevo"];
const FORMATOS = [
  "unico",
  "tapa",
  "pincho",
  "media_racion",
  "racion",
  "racion_mediana",
  "racion_grande",
  "unidad",
  "media_docena",
  "docena",
  "copa",
  "botella",
  "jarra",
  "pequeno",
  "mediano",
  "grande",
  "otro",
];

const platos = todosLosPlatosDemo();

describe("CARTA_DEMO · local", () => {
  const { local } = CARTA_DEMO;

  it("es «Cafetería La Guagua» con slug demo", () => {
    expect(local.nombre).toBe("Cafetería La Guagua");
    expect(local.slug).toBe("demo");
  });

  it("cumple los límites de texto y el formato del slug", () => {
    expect(local.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(local.nombre.length).toBeLessThanOrEqual(L.nombreLocal);
    expect(local.descripcion.length).toBeLessThanOrEqual(L.descripcionLocal);
  });

  it("avisa de que es una carta de ejemplo", () => {
    expect(local.descripcion).toMatch(/ejemplo/i);
  });

  it("no se indexa y se publica", () => {
    expect(local.permitirIndexar).toBe(false);
    expect(local.publicado).toBe(true);
  });

  it("tiene un color de marca #rrggbb con contraste >= 4,5:1 sobre blanco", () => {
    expect(local.colorMarca).toMatch(/^#[0-9a-f]{6}$/);
    const canal = (h: string) => {
      const c = parseInt(h, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const lum =
      0.2126 * canal(local.colorMarca.slice(1, 3)) +
      0.7152 * canal(local.colorMarca.slice(3, 5)) +
      0.0722 * canal(local.colorMarca.slice(5, 7));
    expect(1.05 / (lum + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it("horarios: 21 franjas como máximo, 3 por día, HH:MM y días 1..7", () => {
    expect(local.horarios.length).toBeLessThanOrEqual(21);
    const porDia = new Map<number, number>();
    for (const f of local.horarios) {
      expect(f.dia).toBeGreaterThanOrEqual(1);
      expect(f.dia).toBeLessThanOrEqual(7);
      expect(f.abre).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
      expect(f.cierra).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
      porDia.set(f.dia, (porDia.get(f.dia) ?? 0) + 1);
    }
    for (const n of porDia.values()) expect(n).toBeLessThanOrEqual(3);
  });
});

describe("CARTA_DEMO · secciones", () => {
  const { secciones } = CARTA_DEMO;

  it("tiene las ocho secciones en el orden acordado", () => {
    expect(secciones.map((s) => s.nombre)).toEqual([
      "Mariscos",
      "Pescados y cefalópodos",
      "Cazuelas",
      "Carnes y embutidos",
      "Tapas y raciones",
      "Especialidades de la tierra",
      "Postres",
      "Cafés y bebidas",
    ]);
  });

  it("respeta los límites del modelo", () => {
    expect(secciones.length).toBeLessThanOrEqual(L.seccionesPorLocal);
    for (const s of secciones) {
      expect(s.nombre.length).toBeGreaterThanOrEqual(1);
      expect(s.nombre.length).toBeLessThanOrEqual(L.nombreSeccion);
      if (s.descripcion) expect(s.descripcion.length).toBeLessThanOrEqual(L.descripcionSeccion);
    }
  });

  it("todas las secciones tienen platos", () => {
    for (const s of secciones) expect(s.platos.length, s.nombre).toBeGreaterThan(0);
  });

  it("no pasa de 400 platos y ronda los 80", () => {
    expect(platos.length).toBeLessThanOrEqual(L.platosPorLocal);
    expect(platos.length).toBeGreaterThanOrEqual(75);
  });

  it("no repite platos (ni siquiera con otras mayúsculas o tildes)", () => {
    const normalizar = (t: string) =>
      t
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
    const vistos = new Set<string>();
    for (const p of platos) {
      const clave = normalizar(p.nombre);
      expect(vistos.has(clave), `repetido: ${p.nombre}`).toBe(false);
      vistos.add(clave);
    }
  });
});

describe("CARTA_DEMO · platos", () => {
  it("nombre y descripción dentro de los límites", () => {
    for (const p of platos) {
      expect(p.nombre.length, p.nombre).toBeGreaterThanOrEqual(1);
      expect(p.nombre.length, p.nombre).toBeLessThanOrEqual(L.nombrePlato);
      expect(p.descripcion.length, p.nombre).toBeGreaterThan(0);
      expect(p.descripcion.length, p.nombre).toBeLessThanOrEqual(L.descripcionPlatoDemo);
      expect(p.descripcion.length).toBeLessThanOrEqual(L.descripcionPlato);
    }
  });

  it("tiene de 1 a 6 variantes de precio", () => {
    for (const p of platos) {
      expect(p.precios.length, p.nombre).toBeGreaterThanOrEqual(1);
      expect(p.precios.length, p.nombre).toBeLessThanOrEqual(6);
    }
  });

  it("«unico» solo aparece si es la única variante", () => {
    for (const p of platos) {
      if (p.precios.some((v) => v.formato === "unico")) expect(p.precios.length, p.nombre).toBe(1);
    }
  });

  it("«otro» siempre lleva texto (1-30) y los demás formatos, null", () => {
    for (const p of platos) {
      for (const v of p.precios) {
        expect(FORMATOS, p.nombre).toContain(v.formato);
        if (v.formato === "otro") {
          expect(v.texto, p.nombre).not.toBeNull();
          expect(v.texto!.length, p.nombre).toBeGreaterThanOrEqual(1);
          expect(v.texto!.length, p.nombre).toBeLessThanOrEqual(L.textoFormatoLibre);
        } else {
          expect(v.texto, p.nombre).toBeNull();
        }
      }
    }
  });

  it("no repite formato salvo «otro» con textos distintos", () => {
    for (const p of platos) {
      const claves = p.precios.map((v) => (v.formato === "otro" ? `otro:${v.texto}` : v.formato));
      expect(new Set(claves).size, p.nombre).toBe(claves.length);
    }
  });

  it("los ids de variante son ^[a-z0-9]{4,12}$ y únicos en cada plato", () => {
    for (const p of platos) {
      for (const v of p.precios) expect(v.id, p.nombre).toMatch(/^[a-z0-9]{4,12}$/);
      expect(new Set(p.precios.map((v) => v.id)).size, p.nombre).toBe(p.precios.length);
    }
  });

  it("los céntimos son enteros entre 0 y 100000 (o null = según mercado)", () => {
    for (const p of platos) {
      for (const v of p.precios) {
        if (v.centimos === null) continue;
        expect(Number.isInteger(v.centimos), p.nombre).toBe(true);
        expect(v.centimos, p.nombre).toBeGreaterThanOrEqual(0);
        expect(v.centimos, p.nombre).toBeLessThanOrEqual(L.centimosMax);
      }
    }
  });

  it("alérgenos, trazas y etiquetas usan códigos válidos y sin repetir", () => {
    for (const p of platos) {
      for (const lista of [p.alergenos, p.trazas]) {
        for (const a of lista) expect(ALERGENOS, p.nombre).toContain(a);
        expect(new Set(lista).size, p.nombre).toBe(lista.length);
      }
      for (const e of p.etiquetas) expect(ETIQUETAS, p.nombre).toContain(e);
      expect(new Set(p.etiquetas).size, p.nombre).toBe(p.etiquetas.length);
    }
  });

  it("una traza no se repite como alérgeno del mismo plato", () => {
    for (const p of platos) {
      for (const t of p.trazas) expect(p.alergenos, p.nombre).not.toContain(t);
    }
  });

  it("no hay fotos de platos", () => {
    for (const p of platos) expect((p as Record<string, unknown>).fotoRuta).toBeUndefined();
  });

  it("usa los precios reales de la carta del bar", () => {
    const precio = (nombre: string, formato: string) =>
      platos.find((p) => p.nombre === nombre)?.precios.find((v) => v.formato === formato)?.centimos;
    expect(precio("Fritura de pescado", "media_racion")).toBe(700);
    expect(precio("Fritura de pescado", "racion")).toBe(950);
    expect(precio("Gamba roja a la plancha", "media_docena")).toBe(700);
    expect(precio("Gamba roja a la plancha", "docena")).toBe(1400);
    expect(precio("Pulpo a la gallega", "racion_mediana")).toBe(1000);
    expect(precio("Pulpo a la gallega", "racion_grande")).toBe(1200);
    expect(precio("Vieira", "unidad")).toBe(400);
    expect(precio("Queso frito", "racion")).toBe(650);
  });

  it("los platos con precio inventado o por revisar llevan aviso", () => {
    const inventados = [
      "Croqueta de jamón y cocido",
      "Chipirones a la plancha",
      "Pan de Calatrava",
      "Tarta de chocolates",
      "Carajillo quemao",
    ];
    for (const n of inventados) {
      const p = platos.find((x) => x.nombre === n);
      expect(p, n).toBeDefined();
      expect(p!.aviso?.tipo, n).toBe("inventado");
    }
    for (const n of ["Crujiente de patata y langostino", "Lacón a la gallega"]) {
      expect(platos.find((x) => x.nombre === n)?.aviso?.tipo, n).toBe("revisar");
    }
  });
});

describe("CARTA_DEMO · menú del día", () => {
  const { menu } = CARTA_DEMO;
  const todosLosNombres = new Set(platos.map((p) => p.nombre));

  it("es el «Menú del día» de 12,50 € de lunes a viernes de 13:00 a 16:00", () => {
    expect(menu.nombre).toBe("Menú del día");
    expect(menu.precioCentimos).toBe(1250);
    expect(menu.dias).toEqual([1, 2, 3, 4, 5]);
    expect(menu.horaInicio).toBe("13:00");
    expect(menu.horaFin).toBe("16:00");
    expect(menu.notas).toBe("Incluye pan, bebida y postre o café");
  });

  it("tiene Primeros, Segundos y Postres con 3 platos de la carta cada uno", () => {
    expect(menu.grupos.map((g) => g.titulo)).toEqual(["Primeros", "Segundos", "Postres"]);
    expect(menu.grupos.length).toBeLessThanOrEqual(L.gruposPorMenu);
    for (const g of menu.grupos) {
      expect(g.titulo.length).toBeLessThanOrEqual(L.tituloGrupo);
      expect(g.items).toHaveLength(3);
      expect(g.items.length).toBeLessThanOrEqual(L.itemsPorGrupo);
      for (const i of g.items) {
        expect(todosLosNombres.has(i.nombre), `no está en la carta: ${i.nombre}`).toBe(true);
        expect(i.nombre.length).toBeLessThanOrEqual(80);
      }
    }
  });

  it("ids de grupo e ítem válidos y únicos; alérgenos válidos", () => {
    const ids = new Set<string>();
    for (const g of menu.grupos) {
      expect(g.id).toMatch(/^[a-z0-9]{4,12}$/);
      expect(ids.has(g.id)).toBe(false);
      ids.add(g.id);
      for (const i of g.items) {
        expect(i.id).toMatch(/^[a-z0-9]{4,12}$/);
        expect(ids.has(i.id)).toBe(false);
        ids.add(i.id);
        for (const a of i.alergenos) expect(ALERGENOS).toContain(a);
      }
    }
  });

  it("cumple los límites de texto", () => {
    expect(menu.nombre.length).toBeLessThanOrEqual(L.nombreMenu);
    expect(menu.notas!.length).toBeLessThanOrEqual(L.notasMenu);
  });

  it("los alérgenos de cada ítem coinciden con los de su plato en la carta", () => {
    for (const g of menu.grupos) {
      for (const i of g.items) {
        const p = platos.find((x) => x.nombre === i.nombre)!;
        expect([...i.alergenos].sort()).toEqual([...p.alergenos].sort());
      }
    }
  });
});
