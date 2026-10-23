import type { NextRequest } from "next/server";
import { z } from "zod";
import { urlPublicaImagen } from "@/lib/dominio/imagenes";
import { CABECERAS_DESCARGA, localDelDuenoOError, respuestaError, urlDeLaCarta } from "@/lib/qr/descarga";
import { FORMATOS_QR, generarPdf, nombreArchivoPdf } from "@/lib/qr/generar";
import { descargarLogo } from "@/lib/qr/logo";

// Sin `export const runtime`: es incompatible con Cache Components y el runtime por defecto ya es Node.js.

const Formato = z.enum(FORMATOS_QR);

/** GET /panel/[local]/qr/pdf?formato=mesa|pegatinas|poster */
export async function GET(request: NextRequest, ctx: RouteContext<"/panel/[local]/qr/pdf">) {
  const formato = Formato.safeParse(request.nextUrl.searchParams.get("formato"));
  if (!formato.success) return respuestaError(400, "formato_invalido");

  const { local: localId } = await ctx.params;
  const acceso = await localDelDuenoOError(localId);
  if ("error" in acceso) return acceso.error;
  const { local } = acceso;

  try {
    const logo = local.logoRuta ? await descargarLogo(urlPublicaImagen(local.logoRuta)) : null;
    const pdf = await generarPdf({
      formato: formato.data,
      local: { nombre: local.nombre, colorMarca: local.colorMarca },
      url: urlDeLaCarta(local.slug),
      logo,
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivoPdf(local.slug, formato.data)}"`,
        ...CABECERAS_DESCARGA,
      },
    });
  } catch {
    return respuestaError(500, "error_servidor");
  }
}
