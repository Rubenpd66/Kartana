"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { panelEs } from "@/lib/i18n/panel.es";
import { NAVEGACION_PANEL, pestanaActiva } from "@/lib/panel/navegacion";
import { IconoPanel } from "./IconoPanel";

/**
 * Navegación del panel de un local: barra inferior fija en móvil (respeta el área segura del iPhone)
 * y columna lateral en escritorio. La pestaña actual lleva `aria-current="page"`.
 */
export function NavegacionPanel({ localId, nombreLocal }: { localId: string; nombreLocal: string }) {
  const activa = pestanaActiva(usePathname(), localId);
  return (
    <>
      <p className="truncate px-4 pt-3 text-sm font-semibold text-texto-suave sm:px-6 lg:hidden">{nombreLocal}</p>
      <nav
        aria-label={panelEs.navegacion.etiqueta}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] lg:top-14 lg:right-auto lg:w-56 lg:border-t-0 lg:border-r lg:pb-0"
      >
        <p className="hidden truncate px-5 pt-5 pb-3 font-titulo text-lg font-semibold lg:block">{nombreLocal}</p>
        <ul className="mx-auto grid max-w-estrecho grid-cols-5 lg:mx-0 lg:max-w-none lg:grid-cols-1 lg:gap-1 lg:px-3">
          {NAVEGACION_PANEL.map((e) => {
            const actual = e.clave === activa;
            return (
              <li key={e.clave}>
                <Link
                  href={e.ruta(localId)}
                  aria-current={actual ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:text-base ${
                    actual ? "text-primario lg:bg-superficie-suave" : "text-texto-suave hover:text-texto"
                  }`}
                >
                  <IconoPanel nombre={e.icono} />
                  {e.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
