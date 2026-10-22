import Link from "next/link";
import { Contenedor } from "@/componentes/Contenedor";
import { clasesBoton } from "@/componentes/ui/Boton";
import { SITIO } from "@/lib/config/sitio";
import { panelEs } from "@/lib/i18n/panel.es";

/** Barra superior fija y mínima del panel: marca a la izquierda, «Cuenta» a la derecha. Sin datos de sesión. */
export function BarraPanel() {
  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-superficie">
      <Contenedor className="flex h-14 items-center justify-between gap-4">
        <Link
          href="/panel"
          aria-label={panelEs.barra.inicioPanel}
          className="font-titulo text-xl font-semibold tracking-tight text-texto"
        >
          {SITIO.nombre}
        </Link>
        <Link href="/panel/cuenta" className={clasesBoton({ variante: "fantasma" })}>
          {panelEs.barra.cuenta}
        </Link>
      </Contenedor>
    </header>
  );
}
