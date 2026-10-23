// Textos calculados de la carta pública (lógica pura, sin React).

import { formatearPrecio } from "@/lib/dominio/precios";
import type { MenuPublico } from "@/lib/tipos/carta";
import type { DiaSemana, Precio } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

/** Etiqueta de una variante: «½ ración», «Docena»…; vacía con "unico"; el texto del dueño con "otro". */
export function etiquetaPrecio(precio: Precio, diccionario: DiccionarioCarta): string {
  if (precio.formato === "otro") return precio.texto ?? "";
  return diccionario.formatos[precio.formato];
}

/** «3,75 €» o «Según mercado» si no hay precio. */
export function importePrecio(precio: Precio, diccionario: DiccionarioCarta): string {
  return precio.centimos === null ? diccionario.textos.segunMercado : formatearPrecio(precio.centimos, diccionario.locale);
}

/**
 * Días del menú en texto: los seguidos como rango («Lunes a Viernes»), los sueltos con comas.
 * El conector «a» sale de la plantilla `horarioMenu` del diccionario («{dias}, de {inicio} a {fin}»).
 */
export function textoDiasMenu(dias: DiaSemana[], diccionario: DiccionarioCarta): string {
  const ordenados = [...new Set(dias)].sort((a, b) => a - b);
  const conector = conectorRango(diccionario);
  const tramos: Array<[DiaSemana, DiaSemana]> = [];
  for (const dia of ordenados) {
    const ultimo = tramos.at(-1);
    if (ultimo && dia === ultimo[1] + 1) ultimo[1] = dia;
    else tramos.push([dia, dia]);
  }
  return tramos
    .flatMap(([desde, hasta]) => {
      if (desde === hasta) return [diccionario.dias[desde]];
      if (hasta === desde + 1) return [diccionario.dias[desde], diccionario.dias[hasta]];
      return [`${diccionario.dias[desde]} ${conector} ${diccionario.dias[hasta]}`];
    })
    .join(", ");
}

/** La palabra entre {inicio} y {fin} de la plantilla («a» en español, «to» en inglés…). */
function conectorRango(diccionario: DiccionarioCarta): string {
  const coincidencia = /\{inicio\}\s*(.*?)\s*\{fin\}/.exec(diccionario.textos.horarioMenu);
  return coincidencia?.[1] || "–";
}

/** «Lunes a Viernes, de 13:00 a 16:00» o «Sábado, Domingo · Todo el día». Sin calcular «hoy». */
export function textoHorarioMenu(
  menu: Pick<MenuPublico, "dias" | "horaInicio" | "horaFin">,
  diccionario: DiccionarioCarta,
): string {
  const dias = textoDiasMenu(menu.dias, diccionario);
  if (!menu.horaInicio || !menu.horaFin) return `${dias} · ${diccionario.textos.todoElDia}`;
  return diccionario.textos.horarioMenu
    .replace("{dias}", dias)
    .replace("{inicio}", menu.horaInicio)
    .replace("{fin}", menu.horaFin);
}

/** `tel:` con solo cifras (y el + inicial); null si el texto no tiene cifras. */
export function enlaceTelefono(telefono: string): string | null {
  const limpio = telefono.trim().replace(/(?!^\+)[^\d]/g, "");
  return /\d/.test(limpio) ? `tel:${limpio}` : null;
}

/** Enlace «Cómo llegar» de Google Maps (es un enlace, no un script). */
export function enlaceMapa(direccion: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

/** Códigos separados por espacios para `data-alergenos` / `data-trazas` (los usa el selector `~=`). */
export function listaDatos(codigos: readonly string[]): string {
  return codigos.join(" ");
}
