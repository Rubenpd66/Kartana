import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BandaDemo } from "@/componentes/carta/BandaDemo";
import { CartaVista } from "@/componentes/carta/CartaVista";
import { Contenedor } from "@/componentes/Contenedor";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { exigirUsuario } from "@/lib/auth/sesion";
import { idiomaVistaPrevia } from "@/lib/carta/idioma-vista-previa";
import { obtenerCartaDelDueno } from "@/lib/datos/panel";
import { convertirACartaPublica } from "@/lib/dominio/carta";
import { urlPublicaImagen } from "@/lib/dominio/imagenes";
import { diccionarioCarta } from "@/lib/i18n/carta";
import { cartaPublicaEs } from "@/lib/i18n/carta-publica.es";
import "@/app/(carta)/carta.css";

const t = cartaPublicaEs.vistaPrevia;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

// La carta tal como la verán los clientes, también si aún no está publicada. Sesión y datos dentro de <Suspense>.
export default function VistaPrevia({ params, searchParams }: PageProps<"/panel/[local]/vista-previa">) {
  return (
    <Suspense
      fallback={
        <Contenedor ancho="estrecho" className="py-6">
          <Esqueleto lineas={8} alto="h-8" etiqueta={t.cargando} />
        </Contenedor>
      }
    >
      <CartaDelDueno params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CartaDelDueno({ params, searchParams }: PageProps<"/panel/[local]/vista-previa">) {
  const { local } = await params;
  await exigirUsuario(`/panel/${local}/vista-previa`);
  // obtenerCartaDelDueno valida el uuid y filtra por dueño (la RLS lo respalda): si no es suyo, null.
  const cartaPanel = await obtenerCartaDelDueno(local);
  if (!cartaPanel) notFound();

  const carta = convertirACartaPublica(cartaPanel, urlPublicaImagen);
  // ?idioma=xx (selector de la vista previa): solo idiomas activos del local; si no, español.
  const idioma = idiomaVistaPrevia((await searchParams).idioma, carta.local.idiomasActivos);
  const vacia = carta.secciones.length === 0 && carta.menus.length === 0;
  return (
    <>
      <BandaDemo>{cartaPanel.local.publicado ? t.bandaPublicada : t.bandaSinPublicar}</BandaDemo>
      {/* Vacía: aviso con enlace a «Carta», pero también la cabecera (nombre, horario…) que ya ha rellenado. */}
      {vacia ? (
        <Contenedor ancho="estrecho" className="py-10 text-center">
          <p className="text-texto-suave">{t.vacia}</p>
          <Link
            href={`/panel/${cartaPanel.local.id}/carta`}
            className="mt-4 inline-flex min-h-12 items-center rounded-full bg-primario px-6 font-semibold text-sobre-primario hover:bg-primario-hover"
          >
            {t.irACarta}
          </Link>
        </Contenedor>
      ) : null}
      <CartaVista carta={carta} idioma={idioma} diccionario={diccionarioCarta(idioma)} modo="vista_previa" />
    </>
  );
}
