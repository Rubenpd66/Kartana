import { describe, expect, it } from "vitest";
import { CARTA_DEMO, todosLosPlatosDemo, type CartaDemo, type PlatoDemo } from "./carta-demo";
import { generarDocumento, generarSemilla } from "./generar-semilla";

const sql = generarSemilla(CARTA_DEMO);

/** Líneas que son una fila de la tabla `platos` (una por plato). */
function filasDePlatos(texto: string): string[] {
  return texto.split("\n").filter((l) => l.startsWith("    (v_local, v_seccion, "));
}

function cartaConPlato(nombre: string, nombreSeccion = "Tapas"): CartaDemo {
  const plato: PlatoDemo = {
    nombre,
    descripcion: "Descripción de prueba",
    precios: [{ id: "v001", formato: "unico", texto: null, centimos: 850 }],
    alergenos: ["gluten"],
    trazas: [],
    etiquetas: [],
  };
  return { ...CARTA_DEMO, secciones: [{ nombre: nombreSeccion, descripcion: null, platos: [plato] }] };
}

describe("generarSemilla", () => {
  it("es un bloque do $$ … $$", () => {
    expect(sql).toMatch(/^do \$\$$/m);
    expect(sql.trimEnd().endsWith("$$;")).toBe(true);
  });

  it("falla con un mensaje claro si el administrador no ha entrado nunca", () => {
    expect(sql).toContain("select id into v_dueno from public.perfiles where correo = 'rubenpd66@gmail.com'");
    expect(sql).toMatch(/if v_dueno is null then\s+raise exception '[^']*debe haber entrado una vez en la web/);
  });

  it("borra el local demo antes de crearlo (idempotente)", () => {
    expect(sql).toContain("delete from public.locales where slug = 'demo';");
    expect(sql.indexOf("delete from public.locales")).toBeLessThan(sql.indexOf("insert into public.locales"));
  });

  it("deja el acceso en cortesía sin fecha de fin", () => {
    expect(sql).toContain(
      "update public.accesos set estado = 'cortesia', vigente_hasta = null where local_id = v_local;",
    );
    expect(sql.indexOf("update public.accesos")).toBeGreaterThan(sql.indexOf("insert into public.locales"));
  });

  it("crea el local publicado y sin indexar, con el color de marca", () => {
    expect(sql).toContain("'demo'");
    expect(sql).toContain("'Cafetería La Guagua'");
    expect(sql).toContain("'#a63d12'");
    expect(sql).toMatch(/true,\s+false\)\s+returning id into v_local/);
  });

  it("tiene tantas filas de platos como CARTA_DEMO", () => {
    expect(filasDePlatos(sql)).toHaveLength(todosLosPlatosDemo().length);
  });

  it("tiene tantas secciones como CARTA_DEMO", () => {
    const n = sql.split("\n").filter((l) => l.startsWith("  insert into public.secciones")).length;
    expect(n).toBe(CARTA_DEMO.secciones.length);
  });

  it("marca los alérgenos como confirmados y no pone fotos", () => {
    for (const fila of filasDePlatos(sql)) {
      expect(fila).toMatch(/, true, array\[|, true, '\{\}'::text\[\]/);
    }
    expect(sql).not.toContain("foto_ruta");
  });

  it("escapa las comillas simples de un nombre con apóstrofo", () => {
    const s = generarSemilla(cartaConPlato("Pulpo d'Ana", "Tapas de Pepe's"));
    expect(s).toContain("'Pulpo d''Ana'");
    expect(s).toContain("'Tapas de Pepe''s'");
    expect(s).not.toContain("'Pulpo d'Ana'");
  });

  it("escapa las comillas dentro del jsonb de precios y del menú", () => {
    const base = cartaConPlato("Plato");
    base.secciones[0]!.platos[0]!.precios = [{ id: "v001", formato: "otro", texto: 'Ración "d\'Ana"', centimos: 100 }];
    const s = generarSemilla(base);
    expect(s).toContain(`"texto":"Ración \\"d''Ana\\""`);
  });

  it("escribe los precios en el formato exacto de la arquitectura", () => {
    expect(sql).toContain(
      `'[{"id":"v001","formato":"media_racion","texto":null,"centimos":700},{"id":"v002","formato":"racion","texto":null,"centimos":950}]'::jsonb`,
    );
  });

  it("escribe null en los céntimos de «según mercado»", () => {
    const base = cartaConPlato("Plato");
    base.secciones[0]!.platos[0]!.precios = [{ id: "v001", formato: "racion", texto: null, centimos: null }];
    expect(generarSemilla(base)).toContain(`"centimos":null`);
  });

  it("escribe el menú con días, horas y grupos", () => {
    expect(sql).toContain("array[1,2,3,4,5]::smallint[]");
    expect(sql).toContain("'13:00'::time");
    expect(sql).toContain("'16:00'::time");
    expect(sql).toContain(`"grupos":[{"id":"grp1","titulo":"Primeros"`);
    expect(sql).toContain("'Incluye pan, bebida y postre o café'");
    expect(sql).toContain("1250");
  });

  it("escribe los horarios como jsonb", () => {
    expect(sql).toContain(`{"dia":1,"abre":"08:00","cierra":"16:30"}`);
  });

  it("rechaza textos con $$ (cerrarían el bloque)", () => {
    expect(() => generarSemilla(cartaConPlato("Mal $$ plato"))).toThrow(/\$\$/);
  });
});

describe("generarDocumento", () => {
  const doc = generarDocumento(CARTA_DEMO);

  it("lista todos los platos de la carta", () => {
    for (const p of todosLosPlatosDemo()) expect(doc).toContain(p.nombre);
  });

  it("recuerda que los alérgenos y las descripciones son orientativos", () => {
    expect(doc).toMatch(/orientativ/i);
  });

  it("tiene las secciones «A revisar con el bar» e «Inventado»", () => {
    expect(doc).toContain("## A revisar con el bar");
    expect(doc).toContain("## Inventado");
    expect(doc).toContain("Crujiente de patata y langostino");
    expect(doc).toContain("Carajillo quemao");
  });

  it("escribe los precios con coma y euro", () => {
    expect(doc).toContain("12,50 €");
    expect(doc).toContain("9,50 €");
  });
});
