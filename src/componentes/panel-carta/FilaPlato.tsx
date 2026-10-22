"use client";

import Link from "next/link";
import { IconoAlergeno } from "@/componentes/alergenos/IconoAlergeno";
import { Insignia } from "@/componentes/ui/Insignia";
import { cartaEs } from "@/lib/i18n/carta.es";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import type { Plato } from "@/lib/tipos/carta";
import type { Resultado } from "@/lib/tipos/resultado";
import { BotonAgotado } from "./BotonAgotado";
import { FlechasOrden } from "./FlechasOrden";
import { resumirPrecios } from "./precios";

const t = panelCartaEs.lista;
const DICCIONARIO_RESUMEN = {
  locale: cartaEs.locale,
  formatos: { ...cartaEs.formatos, ...panelCartaEs.formatosCortos },
  segunMercado: cartaEs.textos.segunMercado,
};

/** Fila de un plato en la lista: toca el texto para editarlo; a la derecha, «Disponible / Agotado». */
export function FilaPlato({
  plato,
  href,
  ordenando,
  esPrimero,
  esUltimo,
  onMover,
  onCambiarAgotado,
  destacado = false,
}: {
  plato: Plato;
  href: string;
  ordenando: boolean;
  esPrimero: boolean;
  esUltimo: boolean;
  onMover: (delta: -1 | 1) => void;
  onCambiarAgotado: (agotado: boolean) => Promise<Resultado>;
  destacado?: boolean;
}) {
  return (
    <li
      id={`plato-${plato.id}`}
      className={`flex scroll-mt-24 items-center gap-3 border-b border-borde px-1 py-3 last:border-b-0 ${destacado ? "bg-exito/10" : ""}`}
    >
      {ordenando ? <FlechasOrden nombre={plato.nombre} esPrimero={esPrimero} esUltimo={esUltimo} onMover={onMover} /> : null}
      <Link href={href} className="block min-h-12 min-w-0 flex-1 text-texto no-underline">
        <span className="flex flex-wrap items-center gap-x-2 font-semibold">
          <span className="sr-only">{t.editar} </span>
          {plato.nombre}
          {!plato.visible ? <Insignia variante="neutra">{t.oculto}</Insignia> : null}
        </span>
        <span className="block text-[0.9375rem] text-texto-suave">{resumirPrecios(plato.precios, DICCIONARIO_RESUMEN)}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1">
          {!plato.alergenosConfirmados ? (
            <Insignia variante="aviso">{t.sinRevisar}</Insignia>
          ) : plato.alergenos.length === 0 ? (
            <span className="text-sm text-texto-suave">{t.sinAlergenos}</span>
          ) : (
            plato.alergenos.map((codigo) => (
              <IconoAlergeno key={codigo} codigo={codigo} tamano={20} titulo={cartaEs.alergenos[codigo]} className="text-texto-suave" />
            ))
          )}
        </span>
      </Link>
      <BotonAgotado nombre={plato.nombre} agotado={plato.agotado} onCambiar={onCambiarAgotado} />
    </li>
  );
}
