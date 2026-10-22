import Link from "next/link";
import { Contenedor } from "@/componentes/Contenedor";
import { comunEs as t } from "@/lib/i18n/comun.es";
import { SITIO } from "@/lib/config/sitio";

const enlacesLegales = [
  { href: "/legal/aviso-legal", texto: t.pie.avisoLegal },
  { href: "/legal/privacidad", texto: t.pie.privacidad },
  { href: "/legal/cookies", texto: t.pie.cookies },
  { href: "/legal/condiciones", texto: t.pie.condiciones },
];

export function Pie() {
  return (
    <footer className="mt-auto border-t border-borde bg-superficie-suave py-8 text-sm text-texto-suave">
      <Contenedor className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-titulo font-semibold text-texto">{SITIO.nombre}</span> · {t.pie.hecho}
        </p>
        <nav aria-label={t.pie.legal}>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {enlacesLegales.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="underline-offset-4 hover:underline">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Contenedor>
    </footer>
  );
}
