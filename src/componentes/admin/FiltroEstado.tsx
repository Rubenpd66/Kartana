import Link from "next/link";
import { adminEs as t } from "@/lib/i18n/admin.es";
import { ESTADOS_FILTRO, type EstadoFiltro } from "./formato";

/** Enlaces `?estado=` (funcionan sin JavaScript). `actual` es el filtro activo o undefined = todos. */
export function FiltroEstado({ actual }: { actual: EstadoFiltro | undefined }) {
  const opciones: Array<{ clave: EstadoFiltro | undefined; texto: string; href: string }> = [
    { clave: undefined, texto: t.filtro.todos, href: "/admin" },
    ...ESTADOS_FILTRO.map((e) => ({ clave: e, texto: t.filtro[e], href: `/admin?estado=${e}` })),
  ];
  return (
    <nav aria-label={t.filtro.etiqueta} className="my-5 flex gap-2 overflow-x-auto pb-1">
      {opciones.map((o) => {
        const activo = o.clave === actual;
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={activo ? "true" : undefined}
            className={`inline-flex min-h-12 flex-none items-center rounded-full border px-4 text-[0.9375rem] font-semibold no-underline ${
              activo ? "border-texto bg-texto text-fondo" : "border-borde bg-superficie text-texto hover:bg-superficie-suave"
            }`}
          >
            {o.texto}
          </Link>
        );
      })}
    </nav>
  );
}
