"use client";

import Link from "next/link";
import { Contenedor } from "@/componentes/Contenedor";
import { comunEs as t } from "@/lib/i18n/comun.es";

export default function PaginaError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="contenido" className="flex flex-1 items-center py-24">
      <Contenedor ancho="estrecho" className="text-center">
        <h1 className="text-3xl font-semibold">{t.error.titulo}</h1>
        <p className="mt-4 text-texto-suave">{t.error.texto}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-full bg-primario px-6 font-medium text-sobre-primario hover:bg-primario-hover"
          >
            {t.error.reintentar}
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-borde px-6 font-medium">
            {t.error.volver}
          </Link>
        </div>
      </Contenedor>
    </main>
  );
}
