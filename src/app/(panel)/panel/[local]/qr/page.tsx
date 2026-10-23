import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { BotonCopiar } from "@/componentes/qr/BotonCopiar";
import { MiniaturaFormato, QrPantalla } from "@/componentes/qr/QrPantalla";
import { Aviso } from "@/componentes/ui/Aviso";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { exigirUsuario } from "@/lib/auth/sesion";
import { obtenerLocalDelDueno } from "@/lib/datos/panel";
import { qrEs } from "@/lib/i18n/qr.es";
import { rutaCarta } from "@/lib/i18n/idiomas";
import { urlDeLaCarta } from "@/lib/qr/descarga";
import { FORMATOS_QR } from "@/lib/qr/formatos";

const t = qrEs;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function PaginaQr({ params }: PageProps<"/panel/[local]/qr">) {
  return (
    <Contenedor ancho="estrecho" className="space-y-5 py-6">
      <header>
        <h1 className="text-[1.75rem]">{t.titulo}</h1>
        <p className="text-texto-suave">{t.intro}</p>
      </header>
      <Suspense fallback={<Esqueleto lineas={6} alto="h-8" />}>
        <Contenido params={params} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({ params }: Pick<PageProps<"/panel/[local]/qr">, "params">) {
  const { local: localId } = await params;
  await exigirUsuario(`/panel/${localId}/qr`);
  const local = await obtenerLocalDelDueno(localId);
  if (!local) notFound();

  const url = urlDeLaCarta(local.slug);
  const base = `/panel/${local.id}/qr`;

  return (
    <>
      {local.publicado ? null : <Aviso variante="aviso">{t.avisoNoPublicada}</Aviso>}

      <Tarjeta relleno="grande" className="grid place-items-center">
        <QrPantalla url={url} etiqueta={t.qrAlt} className="size-56 max-w-full" />
      </Tarjeta>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-superficie-suave py-2 pr-2 pl-4">
          <span className="sr-only">{t.direccion}: </span>
          <code className="min-w-0 flex-1 text-[0.9375rem] [overflow-wrap:anywhere]">{url.replace(/^https?:\/\//, "")}</code>
          <BotonCopiar texto={url} etiqueta={t.copiarEnlace} copiado={t.enlaceCopiado} error={t.noSePudoCopiar} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={rutaCarta(local.slug)} target="_blank" rel="noopener" className={clasesBoton({ variante: "secundario" })}>
            {t.abrirCarta}
          </Link>
          <a href={`${base}/svg`} download className={clasesBoton({ variante: "fantasma" })}>
            {t.descargarSvg}
          </a>
        </div>
      </div>

      <Aviso variante="aviso" sinRol>
        {t.consejo}
      </Aviso>

      <ul className="space-y-4">
        {FORMATOS_QR.map((formato) => {
          const f = t.formatos[formato];
          return (
            <li key={formato}>
              <Tarjeta como="div" className="flex items-center gap-4">
                <MiniaturaFormato formato={formato} />
                <div className="min-w-0 flex-1 space-y-2">
                  <h2 className="font-sans text-[1.0625rem] font-bold">{f.titulo}</h2>
                  <p className="text-sm text-texto-suave">
                    <strong className="font-semibold text-texto">{f.uso}.</strong> {f.descripcion}
                  </p>
                  <a
                    href={`${base}/pdf?formato=${formato}`}
                    download
                    aria-label={`${t.descargarPdf}: ${f.titulo}`}
                    className={clasesBoton({ bloque: true })}
                  >
                    {t.descargarPdf}
                  </a>
                </div>
              </Tarjeta>
            </li>
          );
        })}
      </ul>
    </>
  );
}
