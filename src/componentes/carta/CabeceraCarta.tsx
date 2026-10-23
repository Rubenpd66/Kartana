import { Contenedor } from "@/componentes/Contenedor";
import { enlaceMapa, enlaceTelefono } from "@/lib/carta/textos";
import { textoEn } from "@/lib/carta/textos";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { LocalPublico } from "@/lib/tipos/carta";
import type { ReactNode } from "react";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { HorarioLocal } from "./HorarioLocal";

/**
 * Cabecera con el color del bar: logo, nombre (el único h1), descripción, horario, teléfono, «Cómo llegar»
 * y, como `children`, el selector de idioma.
 */
export function CabeceraCarta({
  local,
  diccionario,
  idioma = "es",
  children,
}: {
  local: LocalPublico;
  diccionario: DiccionarioCarta;
  idioma?: IdiomaCarta;
  children?: ReactNode;
}) {
  const telefono = local.telefono ? enlaceTelefono(local.telefono) : null;
  const descripcion = local.descripcion ? textoEn(local.descripcion, local.traducciones, "descripcion", idioma) : null;
  return (
    <header className="carta-cabecera py-6">
      <Contenedor ancho="estrecho">
        <div className="flex items-center gap-4">
          {local.logoUrl ? (
            // Logo PNG ya reducido (≤ 512 px) en el bucket público; sin next/image (no hay optimización remota).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={local.logoUrl}
              alt=""
              width={64}
              height={64}
              decoding="async"
              className="size-16 flex-none rounded-2xl bg-superficie object-contain"
            />
          ) : null}
          <div className="min-w-0">
            <h1 className="text-[1.75rem] font-semibold">{local.nombre}</h1>
            {descripcion ? (
              <p lang={descripcion.lang} className="mt-1 opacity-90">
                {descripcion.texto}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-start gap-2">
          {children}
          <HorarioLocal horarios={local.horarios} diccionario={diccionario} />
          {telefono ? (
            <a className="pastilla" href={telefono}>
              {diccionario.textos.llamar}
              <span className="sr-only">: {local.telefono}</span>
            </a>
          ) : null}
          {local.direccion ? (
            <a className="pastilla" href={enlaceMapa(local.direccion)} rel="noopener noreferrer">
              {diccionario.textos.comoLlegar}
              <span className="sr-only">: {local.direccion}</span>
            </a>
          ) : null}
        </div>
        {local.direccion ? <p className="mt-3 text-[0.9375rem] opacity-90">{local.direccion}</p> : null}
      </Contenedor>
    </header>
  );
}
