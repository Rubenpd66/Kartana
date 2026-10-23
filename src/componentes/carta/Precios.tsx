import { etiquetaPrecio, importePrecio } from "@/lib/carta/textos";
import type { Precio } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

/** Variantes de precio de un plato: una línea por variante («½ ración 2,25 €»). */
export function Precios({ precios, diccionario }: { precios: Precio[]; diccionario: DiccionarioCarta }) {
  return (
    <ul className="precios mt-1 flex flex-wrap gap-x-4 gap-y-1">
      {precios.map((precio) => {
        const etiqueta = etiquetaPrecio(precio, diccionario);
        return (
          <li key={precio.id} className="whitespace-nowrap">
            {etiqueta ? <span className="text-[0.9375rem] text-texto-suave">{etiqueta} </span> : null}
            <span className="font-bold">{importePrecio(precio, diccionario)}</span>
          </li>
        );
      })}
    </ul>
  );
}
