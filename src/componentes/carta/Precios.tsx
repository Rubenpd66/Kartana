import { elegirEtiquetaPrecio, importePrecio } from "@/lib/carta/textos";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { CampoTraduciblePlato, Precio, Traducciones } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

/** Variantes de precio de un plato: una línea por variante («½ ración 2,25 €»). */
export function Precios({
  precios,
  diccionario,
  idioma = "es",
  traducciones = {},
}: {
  precios: Precio[];
  diccionario: DiccionarioCarta;
  idioma?: IdiomaCarta;
  /** Las del plato: «otro» usa `precio.<id>.texto`. */
  traducciones?: Traducciones<CampoTraduciblePlato>;
}) {
  return (
    <ul className="precios mt-1 flex flex-wrap gap-x-4 gap-y-1">
      {precios.map((precio) => {
        const etiqueta = elegirEtiquetaPrecio(precio, diccionario, traducciones, idioma);
        return (
          <li key={precio.id} className="whitespace-nowrap">
            {etiqueta.texto ? (
              <span lang={etiqueta.lang} className="text-[0.9375rem] text-texto-suave">
                {etiqueta.texto}{" "}
              </span>
            ) : null}
            <span className="font-bold">{importePrecio(precio, diccionario)}</span>
          </li>
        );
      })}
    </ul>
  );
}
