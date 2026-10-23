import { Insignia } from "@/componentes/ui/Insignia";
import { listaDatos } from "@/lib/carta/textos";
import type { PlatoPublico } from "@/lib/tipos/carta";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { ListaAlergenos } from "./ListaAlergenos";
import { Precios } from "./Precios";

/**
 * Un plato de la carta. Los atributos data-* los usa el filtro de alérgenos de carta.css (sin JavaScript):
 * data-alergenos y data-trazas con los códigos separados por espacios, data-confirmado "si" | "no".
 * Pocos nodos a propósito: una carta tiene cientos de platos.
 */
export function TarjetaPlato({ plato, diccionario }: { plato: PlatoPublico; diccionario: DiccionarioCarta }) {
  const { textos } = diccionario;
  const idTitulo = `plato-${plato.id}`;
  return (
    <article
      aria-labelledby={idTitulo}
      className={`plato flex items-start gap-3 border-b border-borde py-4 ${plato.agotado ? "agotado" : ""}`.trim()}
      data-alergenos={listaDatos(plato.alergenos)}
      data-trazas={listaDatos(plato.trazas)}
      data-confirmado={plato.alergenosConfirmados ? "si" : "no"}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h3 id={idTitulo} className="text-lg font-semibold">
          {plato.nombre}
          {plato.agotado ? (
            <>
              {" "}
              <Insignia variante="peligro" className="align-middle">
                {textos.agotado}
              </Insignia>
            </>
          ) : null}
        </h3>
        <Precios precios={plato.precios} diccionario={diccionario} />
        {plato.descripcion ? <p className="descripcion text-base text-texto-suave">{plato.descripcion}</p> : null}
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
        {plato.alergenosConfirmados ? null : (
          <>
            <Insignia variante="aviso">{textos.avisoAlergenos}</Insignia>
            {/* Solo se ve con algún filtro activo (regla de carta.css). */}
            <p className="sin-info text-sm font-semibold text-aviso">{textos.sinInformacionAlergenos}</p>
          </>
        )}
        {plato.etiquetas.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {plato.etiquetas.map((e) => (
              <li key={e}>
                <Insignia>{diccionario.etiquetas[e]}</Insignia>
              </li>
            ))}
          </ul>
        ) : null}
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
    </article>
  );
}
