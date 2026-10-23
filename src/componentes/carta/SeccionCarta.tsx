import { textoEn } from "@/lib/carta/textos";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { SeccionPublica } from "@/lib/tipos/carta";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { TarjetaPlato } from "./TarjetaPlato";

/** Ancla de una sección en la navegación de secciones. */
export const anclaSeccion = (id: string) => `seccion-${id}`;

/** Una sección de la carta (h2) con sus platos (h3). */
export function SeccionCarta({
  seccion,
  diccionario,
  idioma = "es",
}: {
  seccion: SeccionPublica;
  diccionario: DiccionarioCarta;
  idioma?: IdiomaCarta;
}) {
  const ancla = anclaSeccion(seccion.id);
  const nombre = textoEn(seccion.nombre, seccion.traducciones, "nombre", idioma);
  const descripcion = seccion.descripcion ? textoEn(seccion.descripcion, seccion.traducciones, "descripcion", idioma) : null;
  return (
    <section id={ancla} aria-labelledby={`titulo-${ancla}`} className="seccion mt-8">
      <h2 id={`titulo-${ancla}`} lang={nombre.lang} className="pb-2 text-2xl font-semibold">
        {nombre.texto}
      </h2>
      {descripcion ? (
        <p lang={descripcion.lang} className="mt-2 text-texto-suave">
          {descripcion.texto}
        </p>
      ) : null}
      {seccion.platos.map((plato) => (
        <TarjetaPlato key={plato.id} plato={plato} diccionario={diccionario} idioma={idioma} />
      ))}
    </section>
  );
}
