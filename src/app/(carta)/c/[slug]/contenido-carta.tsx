import { CartaVista } from "@/componentes/carta/CartaVista";
import { jsonLdCarta, serializarJsonLd } from "@/lib/carta/json-ld";
import { urlSitio } from "@/lib/config/sitio";
import { diccionarioCarta } from "@/lib/i18n/carta";
import { rutaCarta, type IdiomaCarta } from "@/lib/i18n/idiomas";
import type { CartaPublica } from "@/lib/tipos/carta";

/** Lo que pintan /c/[slug] y /c/[slug]/[idioma]: JSON-LD del idioma y la carta. */
export function ContenidoCarta({ carta, idioma }: { carta: CartaPublica; idioma: IdiomaCarta }) {
  const diccionario = diccionarioCarta(idioma);
  const jsonLd = jsonLdCarta(carta, diccionario, `${urlSitio()}${rutaCarta(carta.local.slug, idioma)}`, idioma);
  return (
    <>
      <script
        type="application/ld+json"
        // Única excepción a «nada de dangerouslySetInnerHTML»: JSON-LD con `<` escapado (serializarJsonLd).
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(jsonLd) }}
      />
      <CartaVista carta={carta} idioma={idioma} diccionario={diccionario} modo="publica" />
    </>
  );
}
