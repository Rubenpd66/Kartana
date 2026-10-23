import Link from "next/link";
import { Aviso } from "@/componentes/ui/Aviso";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { NOMBRE_IDIOMA, rutaCarta } from "@/lib/i18n/idiomas";
import { panelIdiomasEs } from "@/lib/i18n/panel-idiomas.es";
import type { ResumenTraduccion } from "@/lib/tipos/traduccion";

const t = panelIdiomasEs.idiomas.estado;

/** Resumen de un idioma activo: cuántos textos están traducidos, avisos y enlaces. */
export function EstadoIdioma({
  resumen,
  localId,
  slug,
  publicado,
}: {
  resumen: ResumenTraduccion;
  localId: string;
  slug: string;
  publicado: boolean;
}) {
  const { idioma, total, faltan, desactualizadasManual } = resumen;
  const nombre = NOMBRE_IDIOMA[idioma];
  const hechos = total - faltan;
  return (
    <Tarjeta como="li" aria-label={nombre} className="space-y-3">
      <div>
        <h3 className="text-lg">{t.titulo(nombre)}</h3>
        <p className="text-texto-suave">
          {t.traducidos(hechos, total)}
          {total > 0 && faltan === 0 ? ` · ${t.todoAlDia}` : ""}
        </p>
      </div>
      {desactualizadasManual > 0 ? (
        <Aviso variante="aviso" sinRol>
          {t.revisar(desactualizadasManual)}
        </Aviso>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link href={`/panel/${localId}/idiomas/${idioma}`} className={clasesBoton({ variante: "secundario" })}>
          {t.revisarTextos}
          <span className="sr-only"> ({nombre})</span>
        </Link>
        {publicado ? (
          <a
            href={rutaCarta(slug, idioma)}
            target="_blank"
            rel="noreferrer"
            className={clasesBoton({ variante: "fantasma" })}
          >
            {t.verCarta}
            <span className="sr-only">
              {" "}
              ({nombre}){t.nuevaPestana}
            </span>
          </a>
        ) : null}
      </div>
    </Tarjeta>
  );
}
