import type { NextRequest } from "next/server";
import { CABECERAS_DESCARGA, localDelDuenoOError, urlDeLaCarta } from "@/lib/qr/descarga";
import { qrComoSvg } from "@/lib/qr/svg";

/** GET /panel/[local]/qr/svg: el QR suelto en vectores, para llevarlo a una imprenta. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/panel/[local]/qr/svg">) {
  const { local: localId } = await ctx.params;
  const acceso = await localDelDuenoOError(localId);
  if ("error" in acceso) return acceso.error;
  const { local } = acceso;
  return new Response(qrComoSvg(urlDeLaCarta(local.slug), { tamanoPx: 1024 }), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="kartana-${local.slug}-qr.svg"`,
      ...CABECERAS_DESCARGA,
    },
  });
}
