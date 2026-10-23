"use client";

import { useActionState, useId, useState } from "react";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { Interruptor } from "@/componentes/ui/Interruptor";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { IDIOMAS_CARTA, NOMBRE_IDIOMA, type IdiomaCarta } from "@/lib/i18n/idiomas";
import { panelIdiomasEs } from "@/lib/i18n/panel-idiomas.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { MensajeEstado } from "./mensajes";

const t = panelIdiomasEs.idiomas.selector;

/** Lista de los 7 idiomas con interruptor. El español siempre está activo y bloqueado. */
export function SelectorIdiomas({
  activos,
  guardar,
}: {
  activos: readonly IdiomaCarta[];
  guardar: (previo: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
}) {
  const id = useId();
  const [estado, accion] = useActionState(guardar, null);
  const [marcados, setMarcados] = useState<ReadonlySet<IdiomaCarta>>(() => new Set([...activos, "es"]));

  function cambiar(idioma: IdiomaCarta, valor: boolean) {
    setMarcados((previo) => {
      const nuevo = new Set(previo);
      if (valor) nuevo.add(idioma);
      else nuevo.delete(idioma);
      return nuevo;
    });
  }

  return (
    <Tarjeta aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="mb-2 text-xl">
        {t.titulo}
      </h2>
      <form action={accion}>
        <ul className="divide-y divide-borde">
          {IDIOMAS_CARTA.map((idioma) => {
            const esEspanol = idioma === "es";
            return (
              <li key={idioma}>
                <Interruptor
                  etiqueta={NOMBRE_IDIOMA[idioma]}
                  descripcion={esEspanol ? t.espanolBloqueado : undefined}
                  activado={esEspanol || marcados.has(idioma)}
                  disabled={esEspanol}
                  onCambiar={(valor) => cambiar(idioma, valor)}
                />
                {esEspanol || marcados.has(idioma) ? <input type="hidden" name="idiomas" value={idioma} /> : null}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 space-y-2">
          <MensajeEstado estado={estado} />
          <BotonEnviar bloque>{t.guardar}</BotonEnviar>
        </div>
      </form>
    </Tarjeta>
  );
}
