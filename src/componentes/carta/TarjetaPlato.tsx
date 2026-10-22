import { Insignia } from "@/componentes/ui/Insignia";
import { listaDatos } from "@/lib/carta/textos";
import type { PlatoPublico } from "@/lib/tipos/carta";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { ListaAlergenos } from "./ListaAlergenos";
import { Precios } from "./Precios";

/**
 * Un plato de la carta. Los atributos data-* los usa el filtro de alérgenos de carta.css (sin JavaScript):
 * data-alergenos y data-trazas con los códigos separados por espacios, data-confirmado "si" | "no".
 */
export function TarjetaPlato({ plato, diccionario }: { plato: PlatoPublico; diccionario: DiccionarioCarta }) {
  const { textos } = diccionario;
  const idTitulo = `plato-${plato.id}`;
  return (
    <article
      aria-labelledby={idTitulo}
      className={`plato border-b border-borde py-4 ${plato.agotado ? "agotado" : ""}`.trim()}
      data-alergenos={listaDatos(plato.alergenos)}
      data-trazas={listaDatos(plato.trazas)}
      data-confirmado={plato.alergenosConfirmados ? "si" : "no"}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 id={idTitulo} className="text-lg font-semibold">
              {plato.nombre}
            </h3>
            {plato.agotado ? <Insignia variante="peligro">{textos.agotado}</Insignia> : null}
          </div>
          <Precios precios={plato.precios} diccionario={diccionario} />
          {plato.descripcion ? <p className="descripcion mt-1 text-base text-texto-suave">{plato.descripcion}</p> : null}

          <div className="mt-2 space-y-1">
            {plato.alergenos.length > 0 ? (
              <ListaAlergenos alergenos={plato.alergenos} diccionario={diccionario} />
            ) : plato.alergenosConfirmados ? (
              <p className="text-sm text-texto-suave">{textos.sinAlergenosDeclarados}</p>
            ) : null}
            {plato.trazas.length > 0 ? (
              <p className="text-[0.8125rem] text-texto-suave">
                {textos.puedeContenerTrazas}: {plato.trazas.map((c) => diccionario.alergenos[c]).join(", ")}
              </p>
            ) : null}
            {!plato.alergenosConfirmados ? <Insignia variante="aviso">{textos.avisoAlergenos}</Insignia> : null}
          </div>

          {plato.etiquetas.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {plato.etiquetas.map((e) => (
                <li key={e}>
                  <Insignia>{diccionario.etiquetas[e]}</Insignia>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="sin-info mt-2 text-sm font-semibold text-aviso">{textos.sinInformacionAlergenos}</p>
        </div>

        {plato.fotoUrl ? (
          // Sin next/image: no hay optimización remota configurada y las fotos ya llegan reducidas (WebP ≤ 1200 px).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plato.fotoUrl}
            alt=""
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
            className="size-24 flex-none rounded-xl bg-superficie-suave object-cover"
          />
        ) : null}
      </div>
    </article>
  );
}
