import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { CabeceraEditor } from "@/componentes/panel-carta/CabeceraEditor";
import { EditorMenu } from "@/componentes/panel-carta/EditorMenu";
import { Aviso } from "@/componentes/ui/Aviso";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { LIMITES } from "@/lib/dominio/limites";
import { obtenerCartaDelDueno } from "@/lib/datos/panel";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import { obtenerLocalActual } from "@/lib/panel/local-actual";
import { accionBorrarMenu, accionGuardarMenu } from "../acciones";

const t = panelCartaEs.menu;

export const metadata: Metadata = { title: t.metaNuevo, robots: { index: false, follow: false } };

export default function NuevoMenu({ params }: PageProps<"/panel/[local]/menu/nuevo">) {
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
        <Contenido params={params} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({ params }: Pick<PageProps<"/panel/[local]/menu/nuevo">, "params">) {
  const { local } = await params;
  const { id: localId } = await obtenerLocalActual(local);
  const carta = await obtenerCartaDelDueno(localId);
  const rutaMenus = `/panel/${localId}/menu`;
  const cabecera = <CabeceraEditor titulo={t.tituloNuevo} volver={{ href: rutaMenus, texto: t.volver }} />;

  if ((carta?.menus.length ?? 0) >= LIMITES.menusPorLocal) {
    return (
      <>
        {cabecera}
        <Aviso variante="info" sinRol className="mt-4">
          {panelCartaEs.menus.limite(LIMITES.menusPorLocal)}
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
        <EditorMenu localId={localId} menu={null} acciones={{ guardar: accionGuardarMenu, borrar: accionBorrarMenu }} />
      </div>
    </>
  );
}
