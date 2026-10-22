import type { Metadata } from "next";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { validarSiguiente } from "@/lib/auth/redireccion";
import { accesoEs as t } from "@/lib/i18n/acceso.es";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function Entrar({ searchParams }: PageProps<"/entrar">) {
  return (
    <Contenedor ancho="estrecho" className="py-8 sm:py-12">
      <Tarjeta relleno="grande">
        <Suspense fallback={<Esqueleto lineas={5} alto="h-12" />}>
          <FormularioConSiguiente searchParams={searchParams} />
        </Suspense>
      </Tarjeta>
    </Contenedor>
  );
}

/** Lee `?siguiente=` (dato de la petición, por eso va dentro de <Suspense>) y lo valida. */
async function FormularioConSiguiente({ searchParams }: Pick<PageProps<"/entrar">, "searchParams">) {
  const { siguiente } = await searchParams;
  return <FormularioEntrar siguiente={validarSiguiente(Array.isArray(siguiente) ? siguiente[0] : siguiente)} />;
}
