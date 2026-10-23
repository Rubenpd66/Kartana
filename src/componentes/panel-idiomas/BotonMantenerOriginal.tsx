"use client";

import { useActionState } from "react";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { panelIdiomasEs } from "@/lib/i18n/panel-idiomas.es";
import type { TablaTraducible } from "@/lib/tipos/dominio";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { MensajeEstado } from "./mensajes";

const t = panelIdiomasEs.textos;

/** «Mantener el nombre original en todos los idiomas» (útil para «Ajo mataero»). */
export function BotonMantenerOriginal({
  localId,
  tabla,
  filaId,
  mantener,
}: {
  localId: string;
  tabla: TablaTraducible;
  filaId: string;
  mantener: (previo: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
}) {
  const [estado, accion] = useActionState(mantener, null);
  return (
    <form action={accion} className="space-y-1">
      <input type="hidden" name="localId" value={localId} />
      <input type="hidden" name="tabla" value={tabla} />
      <input type="hidden" name="filaId" value={filaId} />
      <BotonEnviar variante="fantasma">{t.mantenerOriginal}</BotonEnviar>
      <MensajeEstado estado={estado} textoOk={t.mantenerHecho} />
    </form>
  );
}
