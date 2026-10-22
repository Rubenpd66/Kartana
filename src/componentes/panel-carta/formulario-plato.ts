// Lectura del formulario del editor de plato (FormData -> EntradaPlato). Pura: navegador y servidor.
// El navegador la usa para validar antes de enviar y la acción de servidor la repite con lo que llega.

import { LIMITES } from "@/lib/dominio/limites";
import type { EntradaPlato } from "@/lib/tipos/carta";
import type { CodigoAlergeno, CodigoEtiqueta, FormatoPrecio, PrecioEntrada } from "@/lib/tipos/dominio";
import { esquemaPlato } from "@/lib/validacion/carta";
import { erroresPorCampo } from "@/lib/validacion/comun";
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

const lista = (fd: FormData, clave: string): string[] => fd.getAll(clave).filter((v): v is string => typeof v === "string");

/**
 * Formulario completo del editor -> EntradaPlato (sin validar: eso lo hace Zod).
 * Casillas e interruptores llegan como "true"; los alérgenos, trazas y etiquetas, un campo por código.
 */
export function leerFormularioPlato(fd: FormData): { entrada: EntradaPlato; errores: Record<string, string> } {
  const { precios, errores } = leerPrecios(fd);
  const platoId = texto(fd, "platoId");
  const entrada: EntradaPlato = {
    localId: texto(fd, "localId"),
    esNuevo: texto(fd, "esNuevo") === "true",
    seccionId: texto(fd, "seccionId"),
    nombre: texto(fd, "nombre"),
    descripcion: texto(fd, "descripcion"),
    precios,
    alergenos: lista(fd, "alergenos") as CodigoAlergeno[],
    trazas: lista(fd, "trazas") as CodigoAlergeno[],
    alergenosConfirmados: texto(fd, "alergenosConfirmados") === "true",
    etiquetas: lista(fd, "etiquetas") as CodigoEtiqueta[],
    fotoRuta: texto(fd, "fotoRuta") || null,
    visible: texto(fd, "visible") === "true",
  };
  if (platoId) entrada.platoId = platoId;
  return { entrada, errores };
}

/** Lee y valida con el mismo esquema que el servidor. Errores por campo: los de importe primero y después los de Zod. */
export function validarFormularioPlato(fd: FormData): { entrada: EntradaPlato; errores: Record<string, string> } {
  const { entrada, errores } = leerFormularioPlato(fd);
  const validado = esquemaPlato.safeParse(entrada);
  return { entrada, errores: validado.success ? errores : { ...erroresPorCampo(validado.error), ...errores } };
}
