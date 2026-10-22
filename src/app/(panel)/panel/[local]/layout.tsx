import { Suspense } from "react";
import { NavegacionPanel } from "@/componentes/panel/NavegacionPanel";
import { obtenerLocalActual } from "@/lib/panel/local-actual";

// No hace `await params` arriba: el usuario y el local se leen dentro de <Suspense>.
export default function LayoutLocal({ children, params }: LayoutProps<"/panel/[local]">) {
  return (
    <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-56">
      <Suspense fallback={<HuecoNavegacion />}>
        <NavegacionDelLocal params={params} />
      </Suspense>
      {children}
    </div>
  );
}

async function NavegacionDelLocal({ params }: Pick<LayoutProps<"/panel/[local]">, "params">) {
  const { local } = await params;
  // obtenerLocalActual comprueba la sesión (exigirUsuario) y que el local es del usuario (o notFound).
  const resumen = await obtenerLocalActual(local);
  return <NavegacionPanel localId={resumen.id} nombreLocal={resumen.nombre} />;
}

/** Reserva el sitio de la barra inferior mientras carga (evita saltos). */
function HuecoNavegacion() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 bottom-0 z-10 h-[calc(4rem+env(safe-area-inset-bottom))] border-t border-borde bg-superficie lg:top-14 lg:right-auto lg:h-auto lg:w-56 lg:border-t-0 lg:border-r"
    />
  );
}
