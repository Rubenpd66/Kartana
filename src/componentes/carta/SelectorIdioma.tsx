import { IDIOMAS_CARTA, NOMBRE_IDIOMA, rutaCarta, type IdiomaCarta } from "@/lib/i18n/idiomas";
import type { PropsCartaVista } from "@/lib/tipos/contratos";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

/**
 * Selector de idioma sin JavaScript: un <details> con enlaces normales a cada idioma activo.
 * En la carta pública van a /c/<slug>/<xx>; en la vista previa cambian `?idioma=` en la misma página.
 * Nada si solo hay un idioma.
 */
export function SelectorIdioma({
  slug,
  idiomasActivos,
  idioma,
  diccionario,
  modo,
}: {
  slug: string;
  idiomasActivos: readonly IdiomaCarta[];
  idioma: IdiomaCarta;
  diccionario: DiccionarioCarta;
  modo: PropsCartaVista["modo"];
}) {
  const idiomas = IDIOMAS_CARTA.filter((i) => idiomasActivos.includes(i));
  if (idiomas.length < 2) return null;
  const enlace = (i: IdiomaCarta) => (modo === "vista_previa" ? `?idioma=${i}` : rutaCarta(slug, i));
  return (
    <details className="desplegable w-full sm:w-auto">
      <summary className="pastilla w-fit">
        {diccionario.textos.idioma}: <span lang={idioma}>{NOMBRE_IDIOMA[idioma]}</span>
      </summary>
      <ul className="lista-desplegable mt-2 flex flex-wrap gap-1 rounded-xl p-2">
        {idiomas.map((i) => (
          <li key={i}>
            {/* Enlace normal (sin precarga ni JavaScript): cada idioma es otra página estática. */}
            <a
              href={enlace(i)}
              hrefLang={i}
              lang={i}
              aria-current={i === idioma ? "page" : undefined}
              className="idioma inline-flex min-h-12 items-center rounded-full px-4 font-medium"
            >
              {NOMBRE_IDIOMA[i]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
