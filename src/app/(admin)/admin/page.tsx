import { Suspense } from "react";
import { FiltroEstado } from "@/componentes/admin/FiltroEstado";
import { Resumen, TablaLocales } from "@/componentes/admin/TablaLocales";
import { esEstadoFiltro, filtrarPorEstado } from "@/componentes/admin/formato";
import { Contenedor } from "@/componentes/Contenedor";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { exigirAdmin } from "@/lib/auth/sesion";
import { listarLocalesAdmin } from "@/lib/datos/admin";
import { adminEs as t } from "@/lib/i18n/admin.es";

export default function PaginaAdmin({ searchParams }: PageProps<"/admin">) {
  return (
    <Contenedor ancho="ancho" className="pb-12">
      <h1 className="my-5 text-[1.75rem]">{t.titulo}</h1>
      <Suspense fallback={<Esqueleto lineas={6} alto="h-10" />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await exigirAdmin();
  const { estado } = await searchParams;
  const valor = Array.isArray(estado) ? estado[0] : estado;
  const filtro = esEstadoFiltro(valor) ? valor : undefined;
  const filas = await listarLocalesAdmin();
  return (
    <>
      <Resumen filas={filas} />
      <FiltroEstado actual={filtro} />
      <TablaLocales filas={filtrarPorEstado(filas, filtro)} />
    </>
  );
}
