// Menús del día en el panel: estado del editor, conversión a EntradaMenu y resúmenes. Pura.

import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import type { EntradaMenu, Menu } from "@/lib/tipos/carta";
import type { CodigoAlergeno, DiaSemana } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { erroresPorCampo } from "@/lib/validacion/comun";
import { esquemaMenu } from "@/lib/validacion/menu";
import { centimosATexto, textoACentimos } from "./precios";

export const DIAS: readonly DiaSemana[] = [1, 2, 3, 4, 5, 6, 7];

export type ItemEditor = { clave: number; id?: string; nombre: string; alergenos: CodigoAlergeno[]; alergenosConfirmados: boolean };
export type GrupoEditor = { clave: number; id?: string; titulo: string; items: ItemEditor[] };
export type EstadoMenu = {
  nombre: string;
  precio: string;
  dias: DiaSemana[];
  todoElDia: boolean;
  horaInicio: string;
  horaFin: string;
  grupos: GrupoEditor[];
  notas: string;
  visible: boolean;
};

/** Ítem vacío para el editor (la clave solo sirve a React). */
export const itemVacio = (clave: number): ItemEditor => ({ clave, nombre: "", alergenos: [], alergenosConfirmados: false });

/** Estado inicial del editor: el menú existente o uno nuevo con Primeros, Segundos y Postres. */
export function estadoDesdeMenu(menu: Menu | null): EstadoMenu {
  let clave = 0;
  if (!menu) {
    return {
      nombre: panelCartaEs.menu.nombrePorDefecto,
      precio: "",
      dias: [1, 2, 3, 4, 5],
      todoElDia: true,
      horaInicio: "",
      horaFin: "",
      grupos: panelCartaEs.menu.gruposPorDefecto.map((titulo) => ({ clave: clave++, titulo, items: [itemVacio(clave++)] })),
      notas: "",
      visible: true,
    };
  }
  return {
    nombre: menu.nombre,
    precio: centimosATexto(menu.precioCentimos),
    dias: [...menu.dias],
    todoElDia: menu.horaInicio === null,
    horaInicio: menu.horaInicio ?? "",
    horaFin: menu.horaFin ?? "",
    grupos: menu.grupos.map((g) => ({
      clave: clave++,
      id: g.id,
      titulo: g.titulo,
      items: g.items.map((i) => ({ clave: clave++, id: i.id, nombre: i.nombre, alergenos: [...i.alergenos], alergenosConfirmados: i.alergenosConfirmados })),
    })),
    notas: menu.notas ?? "",
    visible: menu.visible,
  };
}

/** Estado del editor -> EntradaMenu. Los ítems sin nombre no se envían. Errores del precio aparte (Zod no ve el texto). */
export function entradaDesdeEstado(
  localId: string,
  menuId: string | undefined,
  e: EstadoMenu,
): { entrada: EntradaMenu; errores: Record<string, string> } {
  const errores: Record<string, string> = {};
  let precioCentimos: number | null = null;
  if (e.precio.trim() !== "") {
    precioCentimos = textoACentimos(e.precio);
    if (precioCentimos === null) errores.precioCentimos = "formato";
  }
  const entrada: EntradaMenu = {
    localId,
    nombre: e.nombre,
    precioCentimos,
    dias: DIAS.filter((d) => e.dias.includes(d)),
    horaInicio: e.todoElDia || e.horaInicio === "" ? null : e.horaInicio,
    horaFin: e.todoElDia || e.horaFin === "" ? null : e.horaFin,
    grupos: e.grupos.map((g) => ({
      ...(g.id ? { id: g.id } : {}),
      titulo: g.titulo,
      items: g.items
        .filter((i) => i.nombre.trim() !== "")
        .map((i) => ({ ...(i.id ? { id: i.id } : {}), nombre: i.nombre, alergenos: i.alergenos, alergenosConfirmados: i.alergenosConfirmados })),
    })),
    notas: e.notas,
    visible: e.visible,
  };
  if (menuId) entrada.menuId = menuId;
  return { entrada, errores };
}

/** Convierte y valida con el mismo esquema que el servidor. */
export function validarEstadoMenu(localId: string, menuId: string | undefined, e: EstadoMenu) {
  const { entrada, errores } = entradaDesdeEstado(localId, menuId, e);
  const validado = esquemaMenu.safeParse(entrada);
  return { entrada, errores: validado.success ? errores : { ...erroresPorCampo(validado.error), ...errores } };
}

/** «L–V», «L, X, V», «L–X, S–D»: tramos de 3 o más días seguidos con guion. */
export function resumirDias(dias: readonly DiaSemana[], cortos: Record<DiaSemana, string>): string {
  const ordenados = DIAS.filter((d) => dias.includes(d));
  const tramos: DiaSemana[][] = [];
  for (const d of ordenados) {
    const ultimo = tramos.at(-1);
    if (ultimo && ultimo.at(-1) === d - 1) ultimo.push(d);
    else tramos.push([d]);
  }
  return tramos
    .flatMap((t) => (t.length >= 3 ? [`${cortos[t[0]]}–${cortos[t.at(-1)!]}`] : t.map((d) => cortos[d])))
    .join(", ");
}

/** «L–V, de 13:00 a 16:00» o «L–V · Todo el día». */
export function resumirHorarioMenu(menu: Pick<Menu, "dias" | "horaInicio" | "horaFin">, d: Pick<DiccionarioCarta, "diasCortos" | "textos">): string {
  const dias = resumirDias(menu.dias, d.diasCortos);
  if (menu.horaInicio && menu.horaFin) {
    return d.textos.horarioMenu.replace("{dias}", dias).replace("{inicio}", menu.horaInicio).replace("{fin}", menu.horaFin);
  }
  return `${dias} · ${d.textos.todoElDia}`;
}
