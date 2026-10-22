import Link from "next/link";
import { Contenedor } from "@/componentes/Contenedor";
import { comunEs as t } from "@/lib/i18n/comun.es";
import { SITIO } from "@/lib/config/sitio";

export function Cabecera() {
  return (
    <header className="border-b border-borde bg-superficie">
      <Contenedor className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-titulo text-2xl font-semibold tracking-tight text-texto">
          {SITIO.nombre}
        </Link>
        <nav aria-label="Principal">
          <Link
            href="/entrar"
            className="inline-flex min-h-11 items-center rounded-full bg-primario px-5 font-medium text-sobre-primario hover:bg-primario-hover"
          >
            {t.menu.entrar}
          </Link>
        </nav>
      </Contenedor>
    </header>
  );
}
