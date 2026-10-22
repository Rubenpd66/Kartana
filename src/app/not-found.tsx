import Link from "next/link";
import { Contenedor } from "@/componentes/Contenedor";
import { comunEs as t } from "@/lib/i18n/comun.es";

export default function NoEncontrada() {
  return (
    <main id="contenido" className="flex flex-1 items-center py-24">
      <Contenedor ancho="estrecho" className="text-center">
        <p className="font-titulo text-6xl font-semibold text-primario">404</p>
        <h1 className="mt-4 text-3xl font-semibold">{t.noEncontrada.titulo}</h1>
        <p className="mt-4 text-texto-suave">{t.noEncontrada.texto}</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-primario px-6 font-medium text-sobre-primario hover:bg-primario-hover"
        >
          {t.noEncontrada.volver}
        </Link>
      </Contenedor>
    </main>
  );
}
