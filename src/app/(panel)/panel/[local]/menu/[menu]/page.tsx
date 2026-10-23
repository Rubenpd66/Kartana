import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { CabeceraEditor } from "@/componentes/panel-carta/CabeceraEditor";
import { EditorMenu } from "@/componentes/panel-carta/EditorMenu";
import { Aviso } from "@/componentes/ui/Aviso";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { obtenerMenuDelDueno } from "@/lib/datos/panel";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import { obtenerLocalActual } from "@/lib/panel/local-actual";
import { accionBorrarMenu, accionGuardarMenu } from "../acciones";

const t = panelCartaEs.menu;

export const metadata: Metadata = { title: t.metaEditar, robots: { index: false, follow: false } };

export default function EditarMenu({ params }: PageProps<"/panel/[local]/menu/[menu]">) {
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

async function Contenido({ params }: Pick<PageProps<"/panel/[local]/menu/[menu]">, "params">) {
  const { local, menu: menuId } = await params;
  const { id: localId } = await obtenerLocalActual(local);
  const menu = await obtenerMenuDelDueno(localId, menuId);
  const rutaMenus = `/panel/${localId}/menu`;
  const cabecera = <CabeceraEditor titulo={t.tituloEditar} volver={{ href: rutaMenus, texto: t.volver }} />;

  if (!menu) {
    return (
      <>
        {cabecera}
        <Aviso variante="aviso" sinRol className="mt-4">
          {t.noEncontrado}
        </Aviso>
        <Link href={rutaMenus} className={`${clasesBoton({ variante: "primario" })} mt-4`}>
          {t.volver}
        </Link>
      </>
    );
  }

  return (
    <>
      {cabecera}
      <div className="mt-4">
        <EditorMenu localId={localId} menu={menu} acciones={{ guardar: accionGuardarMenu, borrar: accionBorrarMenu }} />
      </div>
    </>
  );
}
