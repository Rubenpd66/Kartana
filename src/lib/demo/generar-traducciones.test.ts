import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARTA_DEMO, todosLosPlatosDemo } from "./carta-demo";
import { FECHA_TRADUCCIONES_DEMO, calcularHuella, generarTraducciones, traduccionesDeLocal, traduccionesDePlato } from "./generar-traducciones";
import { IDIOMAS_DESTINO_DEMO, TRADUCCIONES_DEMO } from "./traducciones-demo";

// Referencia independiente: SHA-256 de texto.trim().normalize("NFC"), 16 primeros hex.
function huellaReferencia(texto: string): string {
  return createHash("sha256").update(texto.trim().normalize("NFC"), "utf8").digest("hex").slice(0, 16);
}

const sql = generarTraducciones(CARTA_DEMO, TRADUCCIONES_DEMO);

describe("calcularHuella", () => {
  it("coincide con la definición de referencia", () => {
    for (const t of ["Pulpo a la gallega", "  con espacios  ", "Zamburiñas", "Café", "Caña"]) {
      expect(calcularHuella(t)).toBe(huellaReferencia(t));
    }
  });
  it("normaliza NFC y recorta espacios", () => {
    expect(calcularHuella("Café ")).toBe(calcularHuella("Café"));
    expect(calcularHuella("abc")).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("generarTraducciones (SQL)", () => {
  it("marca todo como manual", () => {
    expect(sql).toContain('"origen":"manual"');
    expect(sql).not.toContain('"origen":"auto"');
  });

  it("activa los 7 idiomas en el local demo", () => {
    expect(sql).toContain("idiomas_activos = array['es', 'en', 'fr', 'de', 'ca', 'eu', 'gl']::text[]");
    expect(sql).toContain("where slug = 'demo'");
  });

  it("escapa los apóstrofos (comillas simples duplicadas)", () => {
    expect(sql).toContain("Carte d''exemple de Kartana");
    // Ningún apóstrofo suelto dentro de un literal: tras quitar los pares '' y los literales, no quedan comillas impares.
    const sinPares = sql.replace(/''/g, "");
    const comillas = (sinPares.match(/'/g) ?? []).length;
    expect(comillas % 2).toBe(0);
  });

  it("no contiene $$ salvo el bloque do", () => {
    expect((sql.match(/\$\$/g) ?? []).length).toBe(2);
  });

  it("actualiza cada sección, cada plato y el menú", () => {
    expect((sql.match(/update public\.secciones/g) ?? []).length).toBe(CARTA_DEMO.secciones.length);
    expect((sql.match(/update public\.platos/g) ?? []).length).toBe(todosLosPlatosDemo().length);
    expect((sql.match(/update public\.menus/g) ?? []).length).toBe(1);
  });

  it("falla con aviso claro si no encuentra una fila", () => {
    expect(sql).toContain("if not found then");
  });
});

describe("estructura jsonb de cada fila", () => {
  it("el plato lleva nombre y descripción con la huella del original en los 6 idiomas", () => {
    const plato = todosLosPlatosDemo().find((p) => p.nombre === "Pulpo a la gallega")!;
    const t = traduccionesDePlato(plato, TRADUCCIONES_DEMO);
    expect(Object.keys(t).sort()).toEqual([...IDIOMAS_DESTINO_DEMO].sort());
    expect(t.en?.nombre).toEqual({
      texto: "Galician-style octopus",
      origen: "manual",
      huella: huellaReferencia(plato.nombre),
      fecha: FECHA_TRADUCCIONES_DEMO,
    });
    expect(t.gl?.descripcion?.huella).toBe(huellaReferencia(plato.descripcion));
  });

  it("las variantes con formato «otro» se guardan como precio.<id>.texto con la huella del texto libre", () => {
    const cerveza = todosLosPlatosDemo().find((p) => p.nombre === "Cerveza")!;
    const variante = cerveza.precios.find((v) => v.formato === "otro")!;
    const t = traduccionesDePlato(cerveza, TRADUCCIONES_DEMO);
    const campo = `precio.${variante.id}.texto`;
    expect(t.fr?.[campo]?.texto).toBe("Demi");
    expect(t.fr?.[campo]?.huella).toBe(huellaReferencia("Caña"));
    expect(sql).toContain(`"${campo}"`);
  });

  it("los platos sin variantes libres no llevan claves precio.*", () => {
    const plato = todosLosPlatosDemo().find((p) => p.nombre === "Gamba blanca")!;
    const t = traduccionesDePlato(plato, TRADUCCIONES_DEMO);
    expect(Object.keys(t.en ?? {}).sort()).toEqual(["descripcion", "nombre"]);
  });

  it("el local lleva la descripción traducida", () => {
    const t = traduccionesDeLocal(CARTA_DEMO, TRADUCCIONES_DEMO);
    expect(t.de?.descripcion?.huella).toBe(huellaReferencia(CARTA_DEMO.local.descripcion));
  });

  it("el menú lleva nombre, notas, títulos de grupo e ítems por su id", () => {
    expect(sql).toContain('"grupo.grp1.titulo"');
    expect(sql).toContain('"item.grp1i1.nombre"');
    expect(sql).toContain('"item.grp3i3.nombre"');
    expect(sql).toContain('"notas"');
  });

  it("el SQL contiene la huella de un original concreto", () => {
    expect(sql).toContain(huellaReferencia("Pulpo a la gallega"));
    expect(sql).toContain(huellaReferencia(CARTA_DEMO.menu.notas));
  });
});

describe("semilla guardada", () => {
  it("supabase/semillas/demo-traducciones.sql esta al dia con los datos", () => {
    const guardada = readFileSync(join(process.cwd(), "supabase", "semillas", "demo-traducciones.sql"), "utf8");
    expect(guardada.split("\r\n").join("\n")).toBe(sql);
  });
});
