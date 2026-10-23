// Genera la semilla SQL con las traducciones a mano de la carta de demostración.
//
// Uso (Node 24, desde la raíz del repositorio):
//   node --experimental-strip-types src/lib/demo/generar-traducciones.ts > supabase/semillas/demo-traducciones.sql
//
// Se ejecuta DESPUÉS de supabase/semillas/demo.sql y de la migración de la v0.2 (columna `traducciones`).
// Pone las traducciones con origen «manual» y la huella del texto original, y activa los 7 idiomas.
// Solo importa TIPOS (y módulos de Node) para que Node pueda ejecutarlo sin configuración extra.

import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import type { CartaDemo, PlatoDemo } from "./carta-demo";
import type { PorIdioma, TraduccionesDemo } from "./traducciones-demo";

/** Fecha fija (no la del momento de generar) para que la semilla sea reproducible. */
export const FECHA_TRADUCCIONES_DEMO = "2026-10-23T00:00:00Z";

const IDIOMAS: ReadonlyArray<keyof PorIdioma<unknown>> = ["en", "fr", "de", "ca", "eu", "gl"];
const IDIOMAS_ACTIVOS = ["es", ...IDIOMAS] as const;

type Entrada = { texto: string; origen: "manual"; huella: string; fecha: string };
type MapaTraducciones = Record<string, Record<string, Entrada>>;

/**
 * Huella de un texto original: 16 primeros hex del SHA-256 de `texto.trim().normalize("NFC")`.
 * Es la misma definición que `src/lib/dominio/huella.ts` (carril datos-v02).
 */
export function calcularHuella(texto: string): string {
  return createHash("sha256").update(texto.trim().normalize("NFC"), "utf8").digest("hex").slice(0, 16);
}

function entrada(original: string, traducido: string): Entrada {
  return { texto: traducido, origen: "manual", huella: calcularHuella(original), fecha: FECHA_TRADUCCIONES_DEMO };
}

/** Construye `{ idioma: { campo: entrada } }` a partir de una lista de [campo, original, traducciones]. */
function mapa(campos: Array<[campo: string, original: string, porIdioma: PorIdioma<string>]>): MapaTraducciones {
  const salida: MapaTraducciones = {};
  for (const idioma of IDIOMAS) {
    salida[idioma] = {};
    for (const [campo, original, porIdioma] of campos) salida[idioma][campo] = entrada(original, porIdioma[idioma]);
  }
  return salida;
}

function obtener<T>(tabla: Record<string, T>, clave: string, que: string): T {
  const valor = tabla[clave];
  if (valor === undefined) throw new Error(`Falta la traducción de ${que}: «${clave}»`);
  return valor;
}

export function traduccionesDeLocal(carta: CartaDemo, t: TraduccionesDemo): MapaTraducciones {
  return mapa([["descripcion", carta.local.descripcion, t.local]]);
}

export function traduccionesDeSeccion(nombre: string, descripcion: string | null, t: TraduccionesDemo): MapaTraducciones {
  if (descripcion !== null) throw new Error(`La sección «${nombre}» tiene descripción y no hay traducción para ella`);
  return mapa([["nombre", nombre, obtener(t.secciones, nombre, "la sección")]]);
}

export function traduccionesDePlato(plato: PlatoDemo, t: TraduccionesDemo): MapaTraducciones {
  const par = obtener(t.platos, plato.nombre, "el plato");
  const campos: Array<[string, string, PorIdioma<string>]> = [
    ["nombre", plato.nombre, Object.fromEntries(IDIOMAS.map((i) => [i, par[i][0]])) as PorIdioma<string>],
    ["descripcion", plato.descripcion, Object.fromEntries(IDIOMAS.map((i) => [i, par[i][1]])) as PorIdioma<string>],
  ];
  for (const v of plato.precios) {
    if (v.formato !== "otro" || v.texto === null) continue;
    campos.push([`precio.${v.id}.texto`, v.texto, obtener(t.formatosLibres, v.texto, "la etiqueta de precio")]);
  }
  return mapa(campos);
}

export function traduccionesDeMenu(carta: CartaDemo, t: TraduccionesDemo): MapaTraducciones {
  const { menu } = carta;
  const campos: Array<[string, string, PorIdioma<string>]> = [
    ["nombre", menu.nombre, t.menu.nombre],
    ["notas", menu.notas, t.menu.notas],
  ];
  for (const g of menu.grupos) {
    campos.push([`grupo.${g.id}.titulo`, g.titulo, obtener(t.menu.grupos, g.titulo, "el grupo del menú")]);
    for (const i of g.items) {
      const par = obtener(t.platos, i.nombre, "el ítem del menú");
      campos.push([
        `item.${i.id}.nombre`,
        i.nombre,
        Object.fromEntries(IDIOMAS.map((idioma) => [idioma, par[idioma][0]])) as PorIdioma<string>,
      ]);
    }
  }
  return mapa(campos);
}

// ---------------------------------------------------------------------------
// Escapes de SQL (mismo criterio que generar-semilla.ts)
// ---------------------------------------------------------------------------

function sqlTexto(valor: string): string {
  if (valor.includes("$$")) throw new Error(`El texto contiene «$$» y cerraría el bloque do $$: ${valor}`);
  return `'${valor.replace(/'/g, "''")}'`;
}

function sqlJsonb(valor: unknown): string {
  return `${sqlTexto(JSON.stringify(valor))}::jsonb`;
}

function actualizar(tabla: string, condicion: string, traducciones: MapaTraducciones, donde: string, extra = ""): string[] {
  return [
    `  update public.${tabla} set ${extra}traducciones = ${sqlJsonb(traducciones)}`,
    `    where ${condicion};`,
    `  if not found then raise exception ${sqlTexto(`No se encontró ${donde}: ejecuta antes demo.sql`)}; end if;`,
    "",
  ];
}

export function generarTraducciones(carta: CartaDemo, t: TraduccionesDemo): string {
  const { local, secciones, menu } = carta;
  const l: string[] = [
    "-- Traducciones a mano de la carta de demostración «Cafetería La Guagua» (slug demo): en, fr, de, ca, eu, gl.",
    "-- GENERADA con: node --experimental-strip-types src/lib/demo/generar-traducciones.ts > supabase/semillas/demo-traducciones.sql",
    "-- No la edites a mano: cambia src/lib/demo/traducciones-demo.ts y vuelve a generarla.",
    "-- La ejecuta el director como postgres DESPUÉS de demo.sql y de la migración de la v0.2 (columna traducciones).",
    "-- Es idempotente: sustituye las traducciones de las filas de la demo. Todo va con origen manual (la cuota de Google no se toca).",
    "-- La huella de cada traducción es la del texto original en español (SHA-256 de trim + NFC, 16 primeros hex).",
    "",
    "do $$",
    "declare",
    "  v_local uuid;",
    "begin",
    `  select id into v_local from public.locales where slug = ${sqlTexto(local.slug)};`,
    "  if v_local is null then",
    `    raise exception ${sqlTexto("Falta el local demo: ejecuta antes supabase/semillas/demo.sql")};`,
    "  end if;",
    "",
    ...actualizar(
      "locales",
      `slug = ${sqlTexto(local.slug)}`,
      traduccionesDeLocal(carta, t),
      "el local demo",
      `idiomas_activos = array[${IDIOMAS_ACTIVOS.map(sqlTexto).join(", ")}]::text[], `,
    ),
  ];

  for (const s of secciones) {
    l.push(
      ...actualizar(
        "secciones",
        `local_id = v_local and nombre = ${sqlTexto(s.nombre)}`,
        traduccionesDeSeccion(s.nombre, s.descripcion, t),
        `la sección ${s.nombre}`,
      ),
    );
    for (const p of s.platos) {
      l.push(
        ...actualizar(
          "platos",
          `local_id = v_local and nombre = ${sqlTexto(p.nombre)}`,
          traduccionesDePlato(p, t),
          `el plato ${p.nombre}`,
        ),
      );
    }
  }

  l.push(
    ...actualizar(
      "menus",
      `local_id = v_local and nombre = ${sqlTexto(menu.nombre)}`,
      traduccionesDeMenu(carta, t),
      `el menú ${menu.nombre}`,
    ),
    "end",
    "$$;",
    "",
  );
  return l.join("\n");
}

// ---------------------------------------------------------------------------
// Ejecución desde la terminal
// ---------------------------------------------------------------------------

async function principal() {
  const demo = (await import(new URL("./carta-demo.ts", import.meta.url).href)) as typeof import("./carta-demo");
  const traducciones = (await import(
    new URL("./traducciones-demo.ts", import.meta.url).href
  )) as typeof import("./traducciones-demo");
  process.stdout.write(generarTraducciones(demo.CARTA_DEMO, traducciones.TRADUCCIONES_DEMO));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
