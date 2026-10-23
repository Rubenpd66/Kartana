import type { CSSProperties } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { mostrarAvisoTraduccion } from "@/lib/carta/aviso-traduccion";
import { textoEn, type TextoElegido } from "@/lib/carta/textos";
import { colorTextoSobre } from "@/lib/dominio/contraste";
import { SLUG_DEMO } from "@/lib/dominio/slugs";
import type { PropsCartaVista } from "@/lib/tipos/contratos";
import { AvisoAlergenos } from "./AvisoAlergenos";
import { BandaDemo } from "./BandaDemo";
import { CabeceraCarta } from "./CabeceraCarta";
import { FiltroAlergenos } from "./FiltroAlergenos";
import { SpriteAlergenos } from "./IconosCarta";
import { Medidor } from "./Medidor";
import { anclaMenu, MenuDelDia } from "./MenuDelDia";
import { NavSecciones, type EntradaNav } from "./NavSecciones";
import { PieCarta } from "./PieCarta";
import { anclaSeccion, SeccionCarta } from "./SeccionCarta";
import { SelectorIdioma } from "./SelectorIdioma";

/**
 * La carta tal como la ve el cliente del bar, en `idioma`. Componente de servidor, sin datos propios; el único
 * JavaScript es la isla <Medidor> de estadísticas (y no hace nada en la vista previa).
 * La usan /c/[slug], /c/[slug]/[idioma] (modo "publica") y la vista previa del panel (modo "vista_previa").
 */
export function CartaVista({ carta, idioma, diccionario, modo }: PropsCartaVista) {
  const { local, secciones, menus } = carta;
  const colores = { "--marca": local.colorMarca, "--sobre-marca": colorTextoSobre(local.colorMarca) } as CSSProperties;
  const entrada = (ancla: string, { texto, lang }: TextoElegido): EntradaNav => ({ ancla, nombre: texto, lang });
  const entradas = [
    ...menus.map((m) => entrada(anclaMenu(m.id), textoEn(m.nombre, m.traducciones, "nombre", idioma))),
    ...secciones.map((s) => entrada(anclaSeccion(s.id), textoEn(s.nombre, s.traducciones, "nombre", idioma))),
  ];
  const vacia = secciones.length === 0 && menus.length === 0;

  return (
    <div className="carta" style={colores} lang={idioma} data-modo={modo}>
      <SpriteAlergenos />
      {local.slug === SLUG_DEMO ? <BandaDemo>{diccionario.textos.avisoDemo}</BandaDemo> : null}
      <CabeceraCarta local={local} diccionario={diccionario} idioma={idioma}>
        <SelectorIdioma
          slug={local.slug}
          idiomasActivos={local.idiomasActivos}
          idioma={idioma}
          diccionario={diccionario}
          modo={modo}
        />
        {mostrarAvisoTraduccion(carta, idioma) ? (
          <p className="inline-flex min-h-12 items-center text-[0.8125rem] opacity-90">{diccionario.textos.traduccionAutomatica}</p>
        ) : null}
      </CabeceraCarta>
      <NavSecciones entradas={entradas} diccionario={diccionario} />
      <Contenedor ancho="estrecho" className="pb-4">
        {vacia ? (
          <p className="py-12 text-center text-texto-suave">{diccionario.textos.cartaNoDisponible}</p>
        ) : (
          <>
            {secciones.length > 0 ? <FiltroAlergenos diccionario={diccionario} /> : null}
            {menus.map((menu) => (
              <MenuDelDia key={menu.id} menu={menu} diccionario={diccionario} idioma={idioma} />
            ))}
            {secciones.map((seccion) => (
              <SeccionCarta key={seccion.id} seccion={seccion} diccionario={diccionario} idioma={idioma} />
            ))}
          </>
        )}
        <PieCarta diccionario={diccionario} />
      </Contenedor>
      <AvisoAlergenos diccionario={diccionario} />
      <Medidor localId={local.id} idioma={idioma} modo={modo} />
    </div>
  );
}
