// Textos calculados de la carta pública (lógica pura, sin React).

import { formatearPrecio } from "@/lib/dominio/precios";
import { elegirTexto } from "@/lib/dominio/traducir";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { MenuPublico } from "@/lib/tipos/carta";
import type { CampoTraduciblePlato, DiaSemana, Precio, Traducciones } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

/** Un texto ya elegido para un idioma. `lang: "es"` cuando se muestra el original español en otro idioma. */
export type TextoElegido = { texto: string; lang?: "es" };

/** `elegirTexto` en la forma que usan los componentes: `<p lang={t.lang}>{t.texto}</p>`. */
export function textoEn<C extends string>(
  original: string,
  traducciones: Traducciones<C>,
  campo: C,
  idioma: IdiomaCarta,
): TextoElegido {
  const { texto, esOriginal } = elegirTexto(original, traducciones, campo, idioma);
  return esOriginal ? { texto, lang: "es" } : { texto };
}

/**
 * Etiqueta de una variante en un idioma: «Half portion», «Dozen»… del diccionario; vacía con "unico";
 * con "otro", la traducción de `precio.<id>.texto` (o el texto del dueño, marcado en español).
 */
export function elegirEtiquetaPrecio(
  precio: Precio,
  diccionario: DiccionarioCarta,
  traducciones: Traducciones<CampoTraduciblePlato>,
  idioma: IdiomaCarta,
): TextoElegido {
  if (precio.formato !== "otro") return { texto: diccionario.formatos[precio.formato] };
  return textoEn(precio.texto ?? "", traducciones, `precio.${precio.id}.texto`, idioma);
}

/** Etiqueta de una variante en español (o en el idioma dado): solo el texto. */
export function etiquetaPrecio(
  precio: Precio,
  diccionario: DiccionarioCarta,
  traducciones: Traducciones<CampoTraduciblePlato> = {},
  idioma: IdiomaCarta = "es",
): string {
  return elegirEtiquetaPrecio(precio, diccionario, traducciones, idioma).texto;
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
