// Filas de Supabase (snake_case) -> tipos de la app (camelCase). Funciones puras: sin red.
// Defensivas con el jsonb: lo que no encaja se descarta en lugar de romper la página.

import { esAlergeno } from "@/lib/dominio/alergenos";
import { esEtiqueta } from "@/lib/dominio/etiquetas";
import { esFormatoPrecio } from "@/lib/dominio/precios";
import { esIdiomaCarta, type IdiomaCarta } from "@/lib/i18n/idiomas";
import type { GrupoMenu, Local, Menu, Plato, Seccion } from "@/lib/tipos/carta";
import type { Acceso } from "@/lib/tipos/cuentas";
import type { CodigoAlergeno, CodigoEtiqueta, DiaSemana, FranjaHoraria, Precio, Traducciones } from "@/lib/tipos/dominio";
import type { ContenidoMenu, FilaAcceso, FilaLocal, FilaMenu, FilaPlato, FilaSeccion, Json } from "./filas";

type Objeto = { [clave: string]: Json };

const esObjeto = (v: unknown): v is Objeto => typeof v === "object" && v !== null && !Array.isArray(v);

function traducciones<C extends string>(valor: Json | undefined): Traducciones<C> {
  return (esObjeto(valor) ? valor : {}) as Traducciones<C>;
}

const alergenos = (lista: unknown): CodigoAlergeno[] =>
  Array.isArray(lista) ? lista.filter((x): x is CodigoAlergeno => typeof x === "string" && esAlergeno(x)) : [];

const etiquetas = (lista: unknown): CodigoEtiqueta[] =>
  Array.isArray(lista) ? lista.filter((x): x is CodigoEtiqueta => typeof x === "string" && esEtiqueta(x)) : [];

const esDia = (x: unknown): x is DiaSemana => typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 7;

/** "13:00:00" (Postgres `time`) -> "13:00". */
export function horaCorta(hora: string | null): string | null {
  return hora === null ? null : hora.slice(0, 5);
}

export function horariosDeFila(valor: Json): FranjaHoraria[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((f) =>
    esObjeto(f) && esDia(f.dia) && typeof f.abre === "string" && typeof f.cierra === "string"
      ? [{ dia: f.dia, abre: f.abre, cierra: f.cierra }]
      : [],
  );
}

export function preciosDeFila(valor: Json): Precio[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((p) => {
    if (!esObjeto(p) || typeof p.id !== "string" || typeof p.formato !== "string" || !esFormatoPrecio(p.formato)) return [];
    const centimos = typeof p.centimos === "number" ? p.centimos : null;
    const texto = typeof p.texto === "string" ? p.texto : null;
    return [{ id: p.id, formato: p.formato, texto, centimos }];
  });
}

export function gruposDeContenido(valor: Json): GrupoMenu[] {
  if (!esObjeto(valor) || !Array.isArray(valor.grupos)) return [];
  return valor.grupos.flatMap((g) => {
    if (!esObjeto(g) || typeof g.id !== "string" || typeof g.titulo !== "string" || !Array.isArray(g.items)) return [];
    const items = g.items.flatMap((i) =>
      esObjeto(i) && typeof i.id === "string" && typeof i.nombre === "string"
        ? [{ id: i.id, nombre: i.nombre, alergenos: alergenos(i.alergenos), alergenosConfirmados: i.alergenos_confirmados === true }]
        : [],
    );
    return [{ id: g.id, titulo: g.titulo, items }];
  });
}

/** Grupos del menú (camelCase) -> jsonb `contenido` de la base de datos (snake_case). */
export function contenidoDeGrupos(grupos: GrupoMenu[]): ContenidoMenu {
  return {
    grupos: grupos.map((g) => ({
      id: g.id,
      titulo: g.titulo,
      items: g.items.map((i) => ({ id: i.id, nombre: i.nombre, alergenos: i.alergenos, alergenos_confirmados: i.alergenosConfirmados })),
    })),
  };
}

/** Fila completa del dueño o fila pública (sin dueno_id ni creado_en: entonces creadoEn = actualizadoEn). */
export function filaALocal(fila: Omit<FilaLocal, "dueno_id" | "creado_en"> & { creado_en?: string }): Local {
  const idiomas = (fila.idiomas_activos ?? []).filter((i): i is IdiomaCarta => esIdiomaCarta(i));
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    direccion: fila.direccion,
    telefono: fila.telefono,
    logoRuta: fila.logo_ruta,
    colorMarca: fila.color_marca,
    horarios: horariosDeFila(fila.horarios),
    idiomaBase: esIdiomaCarta(fila.idioma_base) ? fila.idioma_base : "es",
    idiomasActivos: idiomas.includes("es") ? idiomas : ["es", ...idiomas],
    traducciones: traducciones(fila.traducciones),
    publicado: fila.publicado,
    permitirIndexar: fila.permitir_indexar,
    creadoEn: fila.creado_en ?? fila.actualizado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

export function filaASeccion(fila: Omit<FilaSeccion, "creado_en" | "actualizado_en">): Seccion {
  return {
    id: fila.id,
    localId: fila.local_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    orden: fila.orden,
    visible: fila.visible,
    traducciones: traducciones(fila.traducciones),
  };
}

export function filaAPlato(fila: Omit<FilaPlato, "creado_en">): Plato {
  return {
    id: fila.id,
    localId: fila.local_id,
    seccionId: fila.seccion_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precios: preciosDeFila(fila.precios),
    alergenos: alergenos(fila.alergenos),
    trazas: alergenos(fila.trazas),
    alergenosConfirmados: fila.alergenos_confirmados,
    etiquetas: etiquetas(fila.etiquetas),
    fotoRuta: fila.foto_ruta,
    orden: fila.orden,
    agotado: fila.agotado,
    visible: fila.visible,
    traducciones: traducciones(fila.traducciones),
    actualizadoEn: fila.actualizado_en,
  };
}

export function filaAMenu(fila: Omit<FilaMenu, "creado_en" | "actualizado_en">): Menu {
  return {
    id: fila.id,
    localId: fila.local_id,
    nombre: fila.nombre,
    precioCentimos: fila.precio_centimos,
    dias: ((fila.dias ?? []) as unknown[]).filter(esDia),
    horaInicio: horaCorta(fila.hora_inicio),
    horaFin: horaCorta(fila.hora_fin),
    grupos: gruposDeContenido(fila.contenido),
    notas: fila.notas,
    orden: fila.orden,
    visible: fila.visible,
    traducciones: traducciones(fila.traducciones),
  };
}

export function filaAAcceso(fila: FilaAcceso): Acceso {
  return {
    localId: fila.local_id,
    estado: fila.estado,
    plan: fila.plan,
    vigenteHasta: fila.vigente_hasta,
    notas: fila.notas,
    actualizadoEn: fila.actualizado_en,
  };
}
