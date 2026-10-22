"use client";

import { useState, useTransition } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { Boton } from "@/componentes/ui/Boton";
import { ConfirmarBorrado } from "@/componentes/ui/ConfirmarBorrado";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { Resultado } from "@/lib/tipos/resultado";
import { mensajeGeneral } from "./errores";

const t = panelLocalEs.inicio;

/** Publicar con un clic; despublicar con confirmación. `cambiar` es la acción de servidor ya enlazada al local. */
export function BotonPublicar({
  publicado,
  cambiar,
}: {
  publicado: boolean;
  cambiar: (publicado: boolean) => Promise<Resultado>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  async function aplicar(valor: boolean) {
    const r = await cambiar(valor);
    setError(mensajeGeneral(r));
  }

  return (
    <div className="space-y-3">
      {publicado ? (
        <ConfirmarBorrado
          etiquetaBoton={t.despublicar}
          titulo={t.despublicarTitulo}
          descripcion={t.despublicarTexto}
          etiquetaConfirmar={t.despublicarConfirmar}
          variante="fantasma"
          onConfirmar={() => aplicar(false)}
        />
      ) : (
        <Boton tamano="grande" bloque cargando={pendiente} onClick={() => iniciar(() => aplicar(true))}>
          {t.publicar}
        </Boton>
      )}
      {error ? <Aviso variante="error">{error}</Aviso> : null}
    </div>
  );
}
