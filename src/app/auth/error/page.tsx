import type { Metadata } from "next";
import Link from "next/link";
import { Contenedor } from "@/componentes/Contenedor";
import { clasesBoton } from "@/componentes/ui/Boton";
import { SITIO } from "@/lib/config/sitio";
import { accesoEs as t } from "@/lib/i18n/acceso.es";

export const metadata: Metadata = { title: t.errorPagina.metaTitulo, robots: { index: false, follow: false } };

export default function ErrorAcceso() {
  return (
    <main id="contenido" className="flex-1">
      <Contenedor ancho="estrecho" className="py-16 text-center">
        <Link href="/" className="font-titulo text-2xl font-semibold">
          {SITIO.nombre}
        </Link>
        <h1 className="mt-10 text-3xl">{t.errorPagina.titulo}</h1>
        <p className="mt-4 text-texto-suave">{t.errorPagina.texto}</p>
        <Link href="/entrar" className={`${clasesBoton({ tamano: "grande" })} mt-8`}>
          {t.errorPagina.volver}
        </Link>
      </Contenedor>
    </main>
  );
}
