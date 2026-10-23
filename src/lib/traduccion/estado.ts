// Estado de las traducciones de una carta (puro, sin red). Lo usan el planificador y el panel de idiomas.

import type { IdiomaDestino } from "@/lib/tipos/dominio";
import type { EstadoCampoTraduccion, ResumenTraduccion, TextoTraducible } from "@/lib/tipos/traduccion";
import type { ResumirTraducciones } from "@/lib/tipos/contratos";

/** Un texto vacío (o solo espacios) no se traduce ni cuenta. */
export function esTraducible(texto: TextoTraducible): boolean {
  return texto.original.trim() !== "";
}

/** Solo idiomas de destino (el español es el original). */
export function soloDestino(idiomas: readonly IdiomaDestino[]): IdiomaDestino[] {
  return idiomas.filter((idioma) => (idioma as string) !== "es");
}

/**
 * Estado de un campo en un idioma. Lo manual nunca pasa a "falta": aunque esté vacío o viejo,
 * es del dueño. Una automática vacía cuenta como que falta (se vuelve a pedir).
 */
export function estadoCampo(texto: TextoTraducible, idioma: IdiomaDestino): EstadoCampoTraduccion {
  const traduccion = texto.traducciones[idioma];
  if (!traduccion) return "falta";
  const alDia = traduccion.huella === texto.huellaActual;
  if (traduccion.origen === "manual") return alDia ? "al_dia_manual" : "desactualizada_manual";
  if (traduccion.texto.trim() === "") return "falta";
  return alDia ? "al_dia_auto" : "desactualizada_auto";
}

/** Se traducirá en la próxima pasada automática. */
export function seRetraduce(estado: EstadoCampoTraduccion): boolean {
  return estado === "falta" || estado === "desactualizada_auto";
}

/**
 * Por idioma: `total` de textos traducibles, `faltan` (los que se traducirán solos: sin traducción
 * o automáticos desactualizados) y `desactualizadasManual` (corregidos a mano cuyo original cambió).
 */
export const resumirTraducciones: ResumirTraducciones = (textos, idiomas) => {
  const traducibles = textos.filter(esTraducible);
  return soloDestino(idiomas).map((idioma): ResumenTraduccion => {
    let faltan = 0;
    let desactualizadasManual = 0;
    for (const texto of traducibles) {
      const estado = estadoCampo(texto, idioma);
      if (seRetraduce(estado)) faltan++;
      else if (estado === "desactualizada_manual") desactualizadasManual++;
    }
    return { idioma, total: traducibles.length, faltan, desactualizadasManual };
  });
};
