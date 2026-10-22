// Lectura del formulario del editor de plato (FormData -> EntradaPlato). Pura: navegador y servidor.
// El navegador la usa para validar antes de enviar y la acción de servidor la repite con lo que llega.

import { LIMITES } from "@/lib/dominio/limites";
import type { FormatoPrecio, PrecioEntrada } from "@/lib/tipos/dominio";
import { textoACentimos } from "./precios";

/** Más filas de las permitidas se leen igual (hasta este tope) para que Zod las rechace con su error. */
const TOPE_FILAS = LIMITES.preciosPorPlato + 4;

const texto = (fd: FormData, clave: string): string => {
  const valor = fd.get(clave);
  return typeof valor === "string" ? valor : "";
};

/**
 * Variantes de precio del formulario: `precios.<i>.formato|id|texto|importe|mercado`.
 * Devuelve las variantes y los errores de importe por campo ("precios.<i>.centimos").
 */
export function leerPrecios(fd: FormData): { precios: PrecioEntrada[]; errores: Record<string, string> } {
  const precios: PrecioEntrada[] = [];
  const errores: Record<string, string> = {};
  for (let i = 0; i < TOPE_FILAS && fd.has(`precios.${i}.formato`); i++) {
    const formato = texto(fd, `precios.${i}.formato`) as FormatoPrecio;
    const id = texto(fd, `precios.${i}.id`);
    const mercado = texto(fd, `precios.${i}.mercado`) === "true";
    const importe = texto(fd, `precios.${i}.importe`);
    let centimos: number | null = null;
    if (!mercado) {
      centimos = textoACentimos(importe);
      if (importe.trim() === "") errores[`precios.${i}.centimos`] = "requerido";
      else if (centimos === null) errores[`precios.${i}.centimos`] = "formato";
    }
    const variante: PrecioEntrada = {
      formato,
      texto: formato === "otro" ? texto(fd, `precios.${i}.texto`).trim() || null : null,
      centimos,
    };
    precios.push(id ? { id, ...variante } : variante);
  }
  return { precios, errores };
}
