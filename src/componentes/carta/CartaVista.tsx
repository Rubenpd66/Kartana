import type { CSSProperties } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { colorTextoSobre } from "@/lib/dominio/contraste";
import { SLUG_DEMO } from "@/lib/dominio/slugs";
import type { PropsCartaVista } from "@/lib/tipos/contratos";
import { AvisoAlergenos } from "./AvisoAlergenos";
import { BandaDemo } from "./BandaDemo";
import { CabeceraCarta } from "./CabeceraCarta";
import { FiltroAlergenos } from "./FiltroAlergenos";
import { anclaMenu, MenuDelDia } from "./MenuDelDia";
import { NavSecciones } from "./NavSecciones";
import { PieCarta } from "./PieCarta";
import { anclaSeccion, SeccionCarta } from "./SeccionCarta";

/**
 * La carta tal como la ve el cliente del bar. Componente de servidor, sin datos propios ni JavaScript:
 * la usan /c/[slug] (modo "publica") y la vista previa del panel (modo "vista_previa").
 */
export function CartaVista({ carta, idioma, diccionario, modo }: PropsCartaVista) {
  const { local, secciones, menus } = carta;
  const colores = { "--marca": local.colorMarca, "--sobre-marca": colorTextoSobre(local.colorMarca) } as CSSProperties;
  const entradas = [
    ...menus.map((m) => ({ ancla: anclaMenu(m.id), nombre: m.nombre })),
    ...secciones.map((s) => ({ ancla: anclaSeccion(s.id), nombre: s.nombre })),
  ];
  const vacia = secciones.length === 0 && menus.length === 0;

  return (
    <div className="carta" style={colores} lang={idioma} data-modo={modo}>
      {local.slug === SLUG_DEMO ? <BandaDemo>{diccionario.textos.avisoDemo}</BandaDemo> : null}
      <CabeceraCarta local={local} diccionario={diccionario} />
      <NavSecciones entradas={entradas} diccionario={diccionario} />
      <Contenedor ancho="estrecho" className="pb-4">
        {vacia ? (
          <p className="py-12 text-center text-texto-suave">{diccionario.textos.cartaNoDisponible}</p>
        ) : (
          <>
            {secciones.length > 0 ? <FiltroAlergenos diccionario={diccionario} /> : null}
            {menus.map((menu) => (
              <MenuDelDia key={menu.id} menu={menu} diccionario={diccionario} />
            ))}
            {secciones.map((seccion) => (
              <SeccionCarta key={seccion.id} seccion={seccion} diccionario={diccionario} />
            ))}
          </>
        )}
        <PieCarta diccionario={diccionario} />
      </Contenedor>
      <AvisoAlergenos diccionario={diccionario} />
    </div>
  );
}
