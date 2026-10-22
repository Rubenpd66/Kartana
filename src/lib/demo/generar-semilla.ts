// Genera la semilla SQL de la carta de demostración y el documento legible a partir de CARTA_DEMO.
//
// Uso (Node 24, desde la raíz del repositorio):
//   node --experimental-strip-types src/lib/demo/generar-semilla.ts > supabase/semillas/demo.sql
// Escribe el SQL por la salida estándar y, además, docs/contenido/carta-demo.md.
//
// Solo importa TIPOS de carta-demo.ts (los datos se cargan con import() dinámico) para que Node pueda
// ejecutarlo sin cambiar la configuración de TypeScript del proyecto.

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { CartaDemo, ItemMenuDemo, PlatoDemo } from "./carta-demo";

export const CORREO_DUENO_DEMO = "rubenpd66+demo@gmail.com";

// ---------------------------------------------------------------------------
// Escapes de SQL
// ---------------------------------------------------------------------------

/** Literal de texto de SQL: comillas simples duplicadas. Falla si el texto cerraría el bloque `$$`. */
function sqlTexto(valor: string): string {
  if (valor.includes("$$")) throw new Error(`El texto contiene «$$» y cerraría el bloque do $$: ${valor}`);
  return `'${valor.replace(/'/g, "''")}'`;
}

function sqlTextoOpcional(valor: string | null): string {
  return valor === null ? "null" : sqlTexto(valor);
}

/** Literal jsonb: JSON con las comillas simples duplicadas. */
function sqlJsonb(valor: unknown): string {
  return `${sqlTexto(JSON.stringify(valor))}::jsonb`;
}

function sqlListaTexto(valores: readonly string[]): string {
  if (valores.length === 0) return "'{}'::text[]";
  return `array[${valores.map(sqlTexto).join(", ")}]::text[]`;
}

// ---------------------------------------------------------------------------
// Semilla
// ---------------------------------------------------------------------------

function filaPlato(p: PlatoDemo, orden: number): string {
  const precios = p.precios.map((v) => ({ id: v.id, formato: v.formato, texto: v.texto, centimos: v.centimos }));
  return [
    "    (v_local, v_seccion",
    sqlTexto(p.nombre),
    sqlTexto(p.descripcion),
    sqlJsonb(precios),
    sqlListaTexto(p.alergenos),
    sqlListaTexto(p.trazas),
    "true",
    sqlListaTexto(p.etiquetas),
    `${orden})`,
  ].join(", ");
}

function itemMenuJson(i: ItemMenuDemo) {
  return { id: i.id, nombre: i.nombre, alergenos: i.alergenos, alergenos_confirmados: true };
}

export function generarSemilla(carta: CartaDemo): string {
  const { local, secciones, menu } = carta;
  const horarios = local.horarios.map((f) => ({ dia: f.dia, abre: f.abre, cierra: f.cierra }));
  const contenidoMenu = {
    grupos: menu.grupos.map((g) => ({ id: g.id, titulo: g.titulo, items: g.items.map(itemMenuJson) })),
  };

  const lineas: string[] = [];
  lineas.push(
    "-- Semilla de la carta de demostración «Cafetería La Guagua» (slug demo).",
    "-- GENERADA con: node --experimental-strip-types src/lib/demo/generar-semilla.ts > supabase/semillas/demo.sql",
    "-- No la edites a mano: cambia src/lib/demo/carta-demo.ts y vuelve a generarla.",
    "-- La ejecuta el director como `postgres` (salta la RLS) DESPUÉS de aplicar las migraciones.",
    "-- Es idempotente: borra el local demo (la cascada borra secciones, platos, menús y acceso) y lo recrea.",
    "-- Precios de la carta real leídos de una foto; descripciones y alérgenos ORIENTATIVOS; sin fotos.",
    "",
    "do $$",
    "declare",
    "  v_dueno uuid;",
    "  v_local uuid;",
    "  v_seccion uuid;",
    "begin",
    `  select id into v_dueno from public.perfiles where correo = ${sqlTexto(CORREO_DUENO_DEMO)};`,
    "  if v_dueno is null then",
    `    raise exception ${sqlTexto(`Falta la cuenta de demo (${CORREO_DUENO_DEMO}) en perfiles: créala antes de ejecutar esta semilla.`)};`,
    "  end if;",
    "",
    `  delete from public.locales where slug = ${sqlTexto(local.slug)};`,
    "",
    "  insert into public.locales",
    "    (dueno_id, slug, nombre, descripcion, direccion, telefono, color_marca, horarios, publicado, permitir_indexar)",
    "  values",
    `    (v_dueno, ${[
      sqlTexto(local.slug),
      sqlTexto(local.nombre),
      sqlTexto(local.descripcion),
      sqlTextoOpcional(local.direccion),
      sqlTextoOpcional(local.telefono),
      sqlTexto(local.colorMarca),
      sqlJsonb(horarios),
      String(local.publicado),
      `${String(local.permitirIndexar)})`,
    ].join(", ")}`,
    "  returning id into v_local;",
    "",
  );

  secciones.forEach((s, i) => {
    lineas.push(
      `  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, ${sqlTexto(s.nombre)}, ${sqlTextoOpcional(s.descripcion)}, ${i}) returning id into v_seccion;`,
      "  insert into public.platos",
      "    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)",
      "  values",
      s.platos.map((p, orden) => filaPlato(p, orden)).join(",\n") + ";",
      "",
    );
  });

  lineas.push(
    "  insert into public.menus",
    "    (local_id, nombre, precio_centimos, dias, hora_inicio, hora_fin, contenido, notas, orden)",
    "  values",
    `    (v_local, ${[
      sqlTexto(menu.nombre),
      String(menu.precioCentimos),
      `array[${menu.dias.join(",")}]::smallint[]`,
      `${sqlTexto(menu.horaInicio)}::time`,
      `${sqlTexto(menu.horaFin)}::time`,
      sqlJsonb(contenidoMenu),
      sqlTexto(menu.notas),
      "0)",
    ].join(", ")};`,
    "",
    "  -- El disparador crea el acceso inicial (prueba o vencido): la demo no caduca nunca.",
    "  update public.accesos set estado = 'cortesia', vigente_hasta = null where local_id = v_local;",
    "end",
    "$$;",
    "",
  );

  return lineas.join("\n");
}

// ---------------------------------------------------------------------------
// Documento legible: docs/contenido/carta-demo.md
// ---------------------------------------------------------------------------

const FORMATOS_ES: Record<string, string> = {
  unico: "",
  tapa: "tapa",
  pincho: "pincho",
  media_racion: "½ ración",
  racion: "ración",
  racion_mediana: "ración mediana",
  racion_grande: "ración grande",
  unidad: "unidad",
  media_docena: "½ docena",
  docena: "docena",
  copa: "copa",
  botella: "botella",
  jarra: "jarra",
  pequeno: "pequeño",
  mediano: "mediano",
  grande: "grande",
};

const ALERGENOS_ES: Record<string, string> = {
  gluten: "gluten",
  crustaceos: "crustáceos",
  huevos: "huevos",
  pescado: "pescado",
  cacahuetes: "cacahuetes",
  soja: "soja",
  lacteos: "lácteos",
  frutos_cascara: "frutos de cáscara",
  apio: "apio",
  mostaza: "mostaza",
  sesamo: "sésamo",
  sulfitos: "sulfitos",
  altramuces: "altramuces",
  moluscos: "moluscos",
};

const DIAS_ES = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function euros(centimos: number | null): string {
  if (centimos === null) return "según mercado";
  return `${(centimos / 100).toFixed(2).replace(".", ",")} €`;
}

function textoPrecios(p: PlatoDemo): string {
  return p.precios
    .map((v) => {
      const etiqueta = v.formato === "otro" ? (v.texto ?? "") : FORMATOS_ES[v.formato];
      return etiqueta ? `${etiqueta} ${euros(v.centimos)}` : euros(v.centimos);
    })
    .join(" · ");
}

function celda(texto: string): string {
  return texto.replace(/\|/g, "\\|");
}

export function generarDocumento(carta: CartaDemo): string {
  const { local, secciones, menu } = carta;
  const platos = secciones.flatMap((s) => s.platos.map((p) => ({ seccion: s.nombre, plato: p })));
  const revisar = platos.filter((x) => x.plato.aviso?.tipo === "revisar");
  const inventados = platos.filter((x) => x.plato.aviso?.tipo === "inventado");

  const l: string[] = [];
  l.push(
    `# Carta de ejemplo: ${local.nombre}`,
    "",
    "> Generado con `node --experimental-strip-types src/lib/demo/generar-semilla.ts > supabase/semillas/demo.sql` a partir de `src/lib/demo/carta-demo.ts`. No lo edites a mano.",
    "",
    `Carta de demostración de Kartana (slug \`${local.slug}\`). Siempre se muestra con la banda «Carta de ejemplo», no sale en Google (\`permitir_indexar = false\`) y no lleva fotos de platos.`,
    "",
    "## Qué es orientativo",
    "",
    "- **Descripciones y alérgenos: orientativos en todos los platos.** Son los más probables según la receta típica; se guardan como confirmados (`alergenos_confirmados = true`) solo para poder probar el filtro de alérgenos. La carta pública lo avisa con la banda «Carta de ejemplo». No son información fiable para una persona alérgica.",
    "- **Precios**: los de la carta real que pasó el usuario (leídos de una foto), salvo los marcados abajo.",
    "- **Fotos**: ninguna. Las del usuario no se publican hasta saber quién las hizo.",
    "",
    "## A revisar con el bar",
    "",
    "Precios leídos de la foto con dudas. Se mantienen tal cual.",
    "",
  );
  for (const x of revisar) l.push(`- **${x.plato.nombre}** (${x.seccion}): ${textoPrecios(x.plato)}. ${x.plato.aviso!.texto}`);
  l.push("", "## Inventado", "", "Nada de esto estaba en la carta del bar. Sirve para que la demo esté completa.", "");
  l.push(
    `- **Local**: dirección y teléfono vacíos; descripción «${local.descripcion}».`,
    `- **Horarios** (inventados): ${(() => {
      const dias = [...new Set(local.horarios.map((f) => f.dia))];
      const franjas = [...new Set(local.horarios.map((f) => `${f.abre}–${f.cierra}`))];
      return `${dias.map((d) => DIAS_ES[d]).join(", ")}: ${franjas.join(" y ")}; el resto, cerrado`;
    })()}.`,
    `- **${menu.nombre}** (inventado): ${euros(menu.precioCentimos)}, ${menu.dias.map((d) => DIAS_ES[d]).join(", ")} de ${menu.horaInicio} a ${menu.horaFin}. Grupos y platos elegidos de la carta. Notas: «${menu.notas}».`,
    `- **Color de marca**: ${local.colorMarca} (elegido para tener contraste suficiente con blanco).`,
  );
  for (const x of inventados) l.push(`- **${x.plato.nombre}** (${x.seccion}): ${x.plato.aviso!.texto}`);

  l.push("", "## La carta", "");
  for (const s of secciones) {
    l.push(`### ${s.nombre}`, "", "| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |", "|---|---|---|---|---|");
    for (const p of s.platos) {
      const al = p.alergenos.map((a) => ALERGENOS_ES[a]).join(", ") || "ninguno";
      const tr = p.trazas.length ? ` (trazas: ${p.trazas.map((a) => ALERGENOS_ES[a]).join(", ")})` : "";
      const marca = p.aviso ? (p.aviso.tipo === "revisar" ? " (revisar)" : " (inventado)") : "";
      l.push(
        `| ${celda(p.nombre)}${marca} | ${celda(p.descripcion)} | ${celda(textoPrecios(p))} | ${celda(al + tr)} | ${celda(p.etiquetas.join(", ") || "—")} |`,
      );
    }
    l.push("");
  }

  l.push(`### ${menu.nombre} (${euros(menu.precioCentimos)})`, "");
  for (const g of menu.grupos) {
    l.push(`**${g.titulo}**`, "");
    for (const i of g.items) l.push(`- ${i.nombre}`);
    l.push("");
  }
  l.push(`${menu.notas}.`, "");
  return l.join("\n");
}

// ---------------------------------------------------------------------------
// Ejecución desde la terminal
// ---------------------------------------------------------------------------

async function principal() {
  const modulo = (await import(new URL("./carta-demo.ts", import.meta.url).href)) as typeof import("./carta-demo");
  const carta = modulo.CARTA_DEMO;
  const rutaDoc = fileURLToPath(new URL("../../../docs/contenido/carta-demo.md", import.meta.url));
  mkdirSync(fileURLToPath(new URL("../../../docs/contenido/", import.meta.url)), { recursive: true });
  writeFileSync(rutaDoc, generarDocumento(carta), "utf8");
  process.stdout.write(generarSemilla(carta));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
