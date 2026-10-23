import type { Metadata } from "next";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { ListaMenus } from "@/componentes/panel-carta/ListaMenus";
import { Aviso } from "@/componentes/ui/Aviso";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { obtenerCartaDelDueno } from "@/lib/datos/panel";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import { obtenerLocalActual } from "@/lib/panel/local-actual";
import { accionOrdenarMenus } from "./acciones";

const t = panelCartaEs.menus;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function PaginaMenus({ params, searchParams }: PageProps<"/panel/[local]/menu">) {
  return (
    <Contenedor ancho="estrecho" className="py-5">
      <h1 className="text-[1.625rem]">{t.titulo}</h1>
      <Suspense fallback={<Esqueleto lineas={4} alto="h-14" className="mt-4" />}>
        <Contenido params={params} searchParams={searchParams} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({ params, searchParams }: Pick<PageProps<"/panel/[local]/menu">, "params" | "searchParams">) {
  const { local } = await params;
  const { id: localId } = await obtenerLocalActual(local);
  const carta = await obtenerCartaDelDueno(localId);
  if (!carta) {
    return (
      <Aviso variante="error" className="mt-4">
        {panelCartaEs.errores.error_servidor}
      </Aviso>
    );
  }
  const { guardado, borrado } = await searchParams;
  return (
    <ListaMenus
      localId={localId}
      menus={carta.menus}
      ordenar={accionOrdenarMenus}
      guardado={typeof guardado === "string" ? guardado : null}
      borrado={borrado === "1"}
    />
  );
}
