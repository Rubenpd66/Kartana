import type { SeccionPublica } from "@/lib/tipos/carta";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { TarjetaPlato } from "./TarjetaPlato";

/** Ancla de una sección en la navegación de secciones. */
export const anclaSeccion = (id: string) => `seccion-${id}`;

/** Una sección de la carta (h2) con sus platos (h3). */
export function SeccionCarta({ seccion, diccionario }: { seccion: SeccionPublica; diccionario: DiccionarioCarta }) {
  const ancla = anclaSeccion(seccion.id);
  return (
    <section id={ancla} aria-labelledby={`titulo-${ancla}`} className="seccion mt-8">
      <h2 id={`titulo-${ancla}`} className="pb-2 text-2xl font-semibold">
        {seccion.nombre}
      </h2>
      {seccion.descripcion ? <p className="mt-2 text-texto-suave">{seccion.descripcion}</p> : null}
      {seccion.platos.map((plato) => (
        <TarjetaPlato key={plato.id} plato={plato} diccionario={diccionario} />
      ))}
    </section>
  );
}
