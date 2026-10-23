// ¿Lleva la carta el aviso «Traducción automática»? Lógica pura.

import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { CartaPublica } from "@/lib/tipos/carta";
import type { Traducciones } from "@/lib/tipos/dominio";

/** Campos con texto original en la carta: [traducciones de la fila, campos que se ven]. */
function camposVisibles(carta: CartaPublica): Array<[Traducciones<string>, string[]]> {
  const { local, secciones, menus } = carta;
  const lista: Array<[Traducciones<string>, string[]]> = [];
  if (local.descripcion) lista.push([local.traducciones, ["descripcion"]]);
  for (const s of secciones) {
    lista.push([s.traducciones, s.descripcion ? ["nombre", "descripcion"] : ["nombre"]]);
    for (const p of s.platos) {
      lista.push([
        p.traducciones,
        [
          "nombre",
          ...(p.descripcion ? ["descripcion"] : []),
          ...p.precios.filter((v) => v.formato === "otro").map((v) => `precio.${v.id}.texto`),
        ],
      ]);
    }
  }
  for (const m of menus) {
    lista.push([
      m.traducciones,
      [
        "nombre",
        ...(m.notas ? ["notas"] : []),
        ...m.grupos.flatMap((g) => [`grupo.${g.id}.titulo`, ...g.items.map((i) => `item.${i.id}.nombre`)]),
      ],
    ]);
  }
  return lista;
}

/** Sí en idiomas distintos del español cuando algún texto que se ve viene de una traducción automática. */
export function mostrarAvisoTraduccion(carta: CartaPublica, idioma: IdiomaCarta): boolean {
  if (idioma === "es") return false;
  return camposVisibles(carta).some(([traducciones, campos]) => {
    const delIdioma = traducciones[idioma];
    return campos.some((campo) => {
      const t = delIdioma?.[campo];
      return !!t && t.texto.trim() !== "" && t.origen !== "manual";
    });
  });
}
