import { IconoAlergeno } from "@/componentes/alergenos/IconoAlergeno";
import { ID_TRAZAS, idCasilla, NOMBRE_CASILLA } from "@/lib/carta/reglas-filtro";
import { ALERGENOS } from "@/lib/dominio/alergenos";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

const OPCION =
  "opcion-al flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-borde bg-superficie px-2.5 py-1 text-[0.9375rem]";

/**
 * Filtro de alérgenos sin JavaScript: las casillas ocultan platos con las reglas :has() de carta.css.
 * El botón «Quitar filtro» es un <button type="reset"> del propio formulario.
 */
export function FiltroAlergenos({ diccionario }: { diccionario: DiccionarioCarta }) {
  const { textos } = diccionario;
  return (
    <form className="filtro mt-4" aria-label={textos.filtrarAlergenos}>
      <details>
        <summary className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-borde bg-superficie px-5 font-semibold">
          {textos.filtrarAlergenos}
          <span className="filtro-activo" aria-hidden="true" />
        </summary>
        <div className="mt-3 rounded-2xl border border-borde bg-superficie p-4">
          <fieldset>
            <legend className="font-semibold">{textos.ocultarPlatosCon}</legend>
            <div className="my-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALERGENOS.map((codigo) => (
                <label key={codigo} className={OPCION}>
                  <input type="checkbox" name={NOMBRE_CASILLA} value={codigo} id={idCasilla(codigo)} className="size-5 flex-none" />
                  <IconoAlergeno codigo={codigo} tamano={22} className="flex-none" />
                  <span>{diccionario.alergenos[codigo]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className={OPCION}>
            <input type="checkbox" id={ID_TRAZAS} className="size-5 flex-none" />
            <span>{textos.incluirTrazas}</span>
          </label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-texto-suave">{textos.avisoAlergenos}</p>
            <button
              type="reset"
              className="min-h-12 cursor-pointer rounded-full px-5 font-semibold text-texto underline-offset-4 hover:underline"
            >
              {textos.quitarFiltro}
            </button>
          </div>
        </div>
      </details>
    </form>
  );
}
