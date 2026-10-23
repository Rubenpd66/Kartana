// Qué hay que traducir (puro, sin red). Solo lo que falta o lo automático desactualizado;
// NUNCA lo corregido a mano (aunque esté viejo: eso lo decide el dueño en el panel).

import type { PlanificarTraducciones } from "@/lib/tipos/contratos";
import type { Pendiente } from "@/lib/tipos/traduccion";
import { esTraducible, estadoCampo, seRetraduce, soloDestino } from "./estado";

export const planificarTraducciones: PlanificarTraducciones = (textos, idiomas) => {
  const destinos = soloDestino(idiomas);
  const pendientes: Pendiente[] = [];
  for (const texto of textos) {
    if (!esTraducible(texto)) continue;
    for (const idioma of destinos) {
      if (!seRetraduce(estadoCampo(texto, idioma))) continue;
      pendientes.push({
        tabla: texto.tabla,
        filaId: texto.filaId,
        campo: texto.campo,
        idioma,
        original: texto.original,
        huella: texto.huellaActual,
      });
    }
  }
  return pendientes;
};
