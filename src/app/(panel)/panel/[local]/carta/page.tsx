import type { Metadata } from "next";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { ListaCarta } from "@/componentes/panel-carta/ListaCarta";
import { Aviso } from "@/componentes/ui/Aviso";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { obtenerCartaDelDueno } from "@/lib/datos/panel";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import { obtenerLocalActual } from "@/lib/panel/local-actual";
import { accionBorrarSeccion, accionCambiarAgotado, accionGuardarSeccion, accionReordenar } from "./acciones";

const t = panelCartaEs.lista;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function PaginaCarta({ params, searchParams }: PageProps<"/panel/[local]/carta">) {
  return (
    <Contenedor ancho="estrecho" className="py-5">
      <h1 className="text-[1.625rem]">{t.titulo}</h1>
      <Suspense fallback={<Esqueleto lineas={6} alto="h-14" className="mt-4" />}>
        <Contenido params={params} searchParams={searchParams} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({ params, searchParams }: Pick<PageProps<"/panel/[local]/carta">, "params" | "searchParams">) {
  const { local } = await params;
  // Comprueba la sesión y que el local es del usuario (o notFound).
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
    <ListaCarta
      localId={localId}
      secciones={carta.secciones}
      guardado={typeof guardado === "string" ? guardado : null}
      borrado={borrado === "1"}
      acciones={{
        cambiarAgotado: accionCambiarAgotado,
        reordenar: accionReordenar,
        guardar: accionGuardarSeccion,
        borrar: accionBorrarSeccion,
      }}
    />
  );
}
