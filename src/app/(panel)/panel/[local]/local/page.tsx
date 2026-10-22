import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { BloqueLogo } from "@/componentes/panel-local/BloqueLogo";
import { EditorHorarios } from "@/componentes/panel-local/EditorHorarios";
import { FormularioColor } from "@/componentes/panel-local/FormularioColor";
import { FormularioDatosLocal } from "@/componentes/panel-local/FormularioDatosLocal";
import { FormularioDireccionCarta } from "@/componentes/panel-local/FormularioDireccionCarta";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { exigirUsuario } from "@/lib/auth/sesion";
import { urlSitio } from "@/lib/config/sitio";
import { obtenerLocalDelDueno } from "@/lib/datos/panel";
import { urlPublicaImagen } from "@/lib/dominio/imagenes";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import {
  comprobarDireccionDelLocal,
  guardarColor,
  guardarDatos,
  guardarDireccionCarta,
  guardarHorariosDelLocal,
  guardarLogoDelLocal,
} from "./acciones";

const t = panelLocalEs.local;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function PaginaLocal({ params }: PageProps<"/panel/[local]/local">) {
  return (
    <Contenedor ancho="estrecho" className="space-y-5 py-6">
      <h1 className="text-[1.75rem]">{t.titulo}</h1>
      <Suspense fallback={<Esqueleto lineas={6} alto="h-8" />}>
        <Bloques params={params} />
      </Suspense>
    </Contenedor>
  );
}

async function Bloques({ params }: Pick<PageProps<"/panel/[local]/local">, "params">) {
  const { local: localId } = await params;
  await exigirUsuario(`/panel/${localId}/local`);
  const local = await obtenerLocalDelDueno(localId);
  if (!local) notFound();

  return (
    <>
      <FormularioDatosLocal
        inicial={{
          nombre: local.nombre,
          descripcion: local.descripcion,
          direccion: local.direccion,
          telefono: local.telefono,
          permitirIndexar: local.permitirIndexar,
        }}
        guardar={guardarDatos.bind(null, local.id)}
      />
      <FormularioDireccionCarta
        slugActual={local.slug}
        urlBase={urlSitio()}
        guardar={guardarDireccionCarta.bind(null, local.id)}
        comprobar={comprobarDireccionDelLocal.bind(null, local.id)}
      />
      <BloqueLogo
        localId={local.id}
        rutaActual={local.logoRuta}
        urlActual={local.logoRuta ? urlPublicaImagen(local.logoRuta) : null}
        guardar={guardarLogoDelLocal.bind(null, local.id)}
      />
      <FormularioColor inicial={local.colorMarca} nombreLocal={local.nombre} guardar={guardarColor.bind(null, local.id)} />
      <EditorHorarios inicial={local.horarios} guardar={guardarHorariosDelLocal.bind(null, local.id)} />
    </>
  );
}
