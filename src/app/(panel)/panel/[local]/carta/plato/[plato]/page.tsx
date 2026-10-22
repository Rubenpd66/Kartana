import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { CabeceraEditor } from "@/componentes/panel-carta/CabeceraEditor";
import { EditorPlato } from "@/componentes/panel-carta/EditorPlato";
import { Aviso } from "@/componentes/ui/Aviso";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { urlPublicaImagen } from "@/lib/dominio/imagenes";
import { obtenerCartaDelDueno } from "@/lib/datos/panel";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import { obtenerLocalActual } from "@/lib/panel/local-actual";
import { accionBorrarPlato, accionGuardarPlato } from "../../acciones";

const t = panelCartaEs.plato;

export const metadata: Metadata = { title: t.metaEditar, robots: { index: false, follow: false } };

export default function EditarPlato({ params }: PageProps<"/panel/[local]/carta/plato/[plato]">) {
  return (
    <Contenedor ancho="estrecho" className="py-3">
      <Suspense
        fallback={
          <>
            <CabeceraEditor titulo={t.tituloEditar} volver={null} />
            <Esqueleto lineas={8} alto="h-12" className="mt-4" />
          </>
        }
      >
        <Contenido params={params} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({ params }: Pick<PageProps<"/panel/[local]/carta/plato/[plato]">, "params">) {
  const { local, plato: platoId } = await params;
  const { id: localId } = await obtenerLocalActual(local);
  const carta = await obtenerCartaDelDueno(localId);
  const rutaCarta = `/panel/${localId}/carta`;
  const volver = { href: rutaCarta, texto: t.volverCarta };
  const plato = carta?.secciones.flatMap((s) => s.platos).find((p) => p.id === platoId) ?? null;

  if (!carta || !plato) {
    return (
      <>
        <CabeceraEditor titulo={t.tituloEditar} volver={volver} />
        <Aviso variante="aviso" sinRol className="mt-4">
          {t.noEncontrado}
        </Aviso>
        <Link href={rutaCarta} className={`${clasesBoton({ variante: "primario" })} mt-4`}>
          {t.irACarta}
        </Link>
      </>
    );
  }

  return (
    <>
      <CabeceraEditor titulo={t.tituloEditar} volver={volver} />
      <div className="mt-4">
        <EditorPlato
          localId={localId}
          plato={plato}
          seccionInicial={plato.seccionId}
          secciones={carta.secciones.map((s) => ({ id: s.id, nombre: s.nombre }))}
          urlFoto={plato.fotoRuta ? urlPublicaImagen(plato.fotoRuta) : null}
          acciones={{ guardar: accionGuardarPlato, borrar: accionBorrarPlato }}
        />
      </div>
    </>
  );
}
