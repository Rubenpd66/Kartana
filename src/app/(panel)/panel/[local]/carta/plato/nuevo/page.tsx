import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { CabeceraEditor } from "@/componentes/panel-carta/CabeceraEditor";
import { EditorPlato } from "@/componentes/panel-carta/EditorPlato";
import { Aviso } from "@/componentes/ui/Aviso";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { obtenerCartaDelDueno } from "@/lib/datos/panel";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import { obtenerLocalActual } from "@/lib/panel/local-actual";
import { accionBorrarPlato, accionGuardarPlato } from "../../acciones";

const t = panelCartaEs.plato;

export const metadata: Metadata = { title: t.metaNuevo, robots: { index: false, follow: false } };

export default function NuevoPlato({ params, searchParams }: PageProps<"/panel/[local]/carta/plato/nuevo">) {
  return (
    <Contenedor ancho="estrecho" className="py-3">
      <Suspense
        fallback={
          <>
            <CabeceraEditor titulo={t.tituloNuevo} volver={null} />
            <Esqueleto lineas={8} alto="h-12" className="mt-4" />
          </>
        }
      >
        <Contenido params={params} searchParams={searchParams} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({ params, searchParams }: Pick<PageProps<"/panel/[local]/carta/plato/nuevo">, "params" | "searchParams">) {
  const { local } = await params;
  // Comprueba la sesión y que el local es del usuario (o notFound).
  const { id: localId } = await obtenerLocalActual(local);
  const carta = await obtenerCartaDelDueno(localId);
  const secciones = (carta?.secciones ?? []).map((s) => ({ id: s.id, nombre: s.nombre }));
  const rutaCarta = `/panel/${localId}/carta`;
  const volver = { href: rutaCarta, texto: t.volverCarta };

  if (secciones.length === 0) {
    return (
      <>
        <CabeceraEditor titulo={t.tituloNuevo} volver={volver} />
        <Aviso variante="info" sinRol className="mt-4">
          {t.sinSecciones}
        </Aviso>
        <Link href={rutaCarta} className={`${clasesBoton({ variante: "primario" })} mt-4`}>
          {t.irACarta}
        </Link>
      </>
    );
  }

  const pedida = (await searchParams).seccion;
  const seccionInicial = secciones.find((s) => s.id === pedida)?.id ?? secciones[0].id;

  return (
    <>
      <CabeceraEditor titulo={t.tituloNuevo} volver={volver} />
      <div className="mt-4">
        <EditorPlato
          localId={localId}
          plato={null}
          seccionInicial={seccionInicial}
          secciones={secciones}
          urlFoto={null}
          acciones={{ guardar: accionGuardarPlato, borrar: accionBorrarPlato }}
        />
      </div>
    </>
  );
}
