// Precios del editor de platos: lógica pura (navegador y servidor).

import { formatearPrecio } from "@/lib/dominio/precios";
import type { FormatoPrecio, PrecioEntrada } from "@/lib/tipos/dominio";

/** «3,75», «3.75», «3», con o sin «€». Sin signo, sin separador de miles y como mucho 2 decimales. */
const IMPORTE = /^(\d{1,7})(?:[.,](\d{1,2}))?$/;

/** Texto escrito por el dueño -> céntimos. null si no es un importe válido. */
export function textoACentimos(texto: string): number | null {
  const limpio = texto.trim().replace(/\s*€$/, "");
  const partes = IMPORTE.exec(limpio);
  if (!partes) return null;
  const euros = Number(partes[1]);
  const centimos = Number((partes[2] ?? "").padEnd(2, "0"));
  return euros * 100 + centimos;
}

/** Céntimos -> texto para el campo («3,75»). null (según mercado) -> "". */
export function centimosATexto(centimos: number | null): string {
  if (centimos === null) return "";
  const euros = Math.floor(centimos / 100);
  const resto = String(centimos % 100).padStart(2, "0");
  return `${euros},${resto}`;
}

export const ATAJOS = ["un_precio", "media_y_racion", "mediana_y_grande", "por_unidad", "media_docena_y_docena"] as const;
export type Atajo = (typeof ATAJOS)[number];

const FORMATOS_ATAJO: Record<Atajo, FormatoPrecio[]> = {
  un_precio: ["unico"],
  media_y_racion: ["media_racion", "racion"],
  mediana_y_grande: ["racion_mediana", "racion_grande"],
  por_unidad: ["unidad"],
  media_docena_y_docena: ["media_docena", "docena"],
};

/** Variantes (vacías) que crea un atajo de un toque. */
export function aplicarAtajo(atajo: Atajo): PrecioEntrada[] {
  return FORMATOS_ATAJO[atajo].map((formato) => ({ formato, texto: null, centimos: null }));
}

/** Formatos del atajo (para marcar como activo el atajo que coincide con las filas actuales). */
export function formatosDeAtajo(atajo: Atajo): readonly FormatoPrecio[] {
  return FORMATOS_ATAJO[atajo];
}

export type DiccionarioResumen = {
  locale: string;
  formatos: Record<FormatoPrecio, string>;
  segunMercado: string;
};

/** «½ 2,25 € · Ración 3,75 €» para la fila del plato en la lista. */
export function resumirPrecios(precios: Array<Pick<PrecioEntrada, "formato" | "texto" | "centimos">>, d: DiccionarioResumen): string {
  return precios
    .map((p) => {
      const etiqueta = p.formato === "otro" ? (p.texto ?? "") : d.formatos[p.formato];
      const importe = p.centimos === null ? d.segunMercado : formatearPrecio(p.centimos, d.locale);
      return etiqueta ? `${etiqueta} ${importe}` : importe;
    })
    .join(" · ");
}
