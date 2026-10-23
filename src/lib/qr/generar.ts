import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { qrEs, type TextosPdf } from "@/lib/i18n/qr.es";
import { Mesa } from "./plantillas/Mesa";
import { Pegatinas } from "./plantillas/Pegatinas";
import { Poster } from "./plantillas/Poster";
import type { FormatoQr } from "./formatos";
import type { LogoPdf } from "./plantillas/comun";

export { FORMATOS_QR, type FormatoQr } from "./formatos";

export type LocalParaPdf = { nombre: string; colorMarca: string };

/** PDF A4 listo para imprimir. `url` es la dirección a la que lleva el QR. */
export async function generarPdf({
  formato,
  local,
  url,
  logo = null,
  textos = qrEs.pdf,
}: {
  formato: FormatoQr;
  local: LocalParaPdf;
  url: string;
  logo?: LogoPdf | null;
  textos?: TextosPdf;
}): Promise<Buffer> {
  const documento =
    formato === "mesa"
      ? createElement(Mesa, { nombre: local.nombre, logo, url, textos })
      : formato === "pegatinas"
        ? createElement(Pegatinas, { nombre: local.nombre, url, textos })
        : createElement(Poster, { nombre: local.nombre, logo, colorMarca: local.colorMarca, url, textos });
  return renderToBuffer(documento as ReactElement<DocumentProps>);
}

/** Nombre del archivo descargado. */
export function nombreArchivoPdf(slug: string, formato: FormatoQr): string {
  return `kartana-${slug}-${formato}.pdf`;
}
