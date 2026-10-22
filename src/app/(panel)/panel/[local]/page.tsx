import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { BloqueAcceso } from "@/componentes/panel-local/BloqueAcceso";
import { BotonPublicar } from "@/componentes/panel-local/BotonPublicar";
import { ListaPasos } from "@/componentes/panel-local/ListaPasos";
import { cambiarPublicacion } from "@/componentes/panel-local/acciones-inicio";
import { direccionPublica } from "@/componentes/panel-local/direccion";
import { pasosPendientes } from "@/componentes/panel-local/pasos";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { Insignia } from "@/componentes/ui/Insignia";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { exigirUsuario } from "@/lib/auth/sesion";
import { urlSitio } from "@/lib/config/sitio";
import { obtenerCartaDelDueno } from "@/lib/datos/panel";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import { rutaCarta } from "@/lib/i18n/idiomas";
import { TITULAR } from "@/lib/legal/titular";

const t = panelLocalEs.inicio;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

// Sin `await params` ni sesión arriba: todo se lee dentro de <Suspense>.
export default function Inicio({ params }: PageProps<"/panel/[local]">) {
  return (
    <Contenedor ancho="estrecho" className="py-6">
      <Suspense fallback={<Esqueleto lineas={5} alto="h-8" />}>
        <ContenidoInicio params={params} />
      </Suspense>
    </Contenedor>
  );
}

async function ContenidoInicio({ params }: Pick<PageProps<"/panel/[local]">, "params">) {
  const { local: localId } = await params;
  await exigirUsuario(`/panel/${localId}`);
  const carta = await obtenerCartaDelDueno(localId);
  if (!carta) notFound();

  const { local, acceso } = carta;
  const enlace = direccionPublica(urlSitio(), local.slug);
  const cambiar = cambiarPublicacion.bind(null, local.id);

  return (
    <div className="space-y-5">
      <h1 className="text-[1.75rem]">{local.nombre}</h1>

      <Tarjeta aria-labelledby="estado-carta" id="publicar">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="estado-carta" className="text-xl">
            {t.estado}
          </h2>
          <Insignia variante={local.publicado ? "exito" : "neutra"}>{local.publicado ? t.publicada : t.borrador}</Insignia>
        </div>
        <p className="mt-3 text-sm text-texto-suave">{t.direccionPublica}</p>
        <p className="break-all font-semibold">{enlace}</p>
        <div className="mt-4 space-y-3">
          {local.publicado ? (
            <Link href={rutaCarta(local.slug)} className={clasesBoton({ tamano: "grande", bloque: true })}>
              {t.verCarta}
            </Link>
          ) : (
            <Link href={`/panel/${local.id}/vista-previa`} className={clasesBoton({ variante: "secundario", tamano: "grande", bloque: true })}>
              {t.vistaPrevia}
            </Link>
          )}
          <BotonPublicar publicado={local.publicado} cambiar={cambiar} />
        </div>
      </Tarjeta>

      <BloqueAcceso acceso={acceso} correoTitular={TITULAR.correo} />

      <Tarjeta aria-labelledby="pasos">
        <h2 id="pasos" className="mb-1 text-xl">
          {t.pasos.titulo}
        </h2>
        <ListaPasos localId={local.id} pasos={pasosPendientes(carta)} />
      </Tarjeta>
    </div>
  );
}
