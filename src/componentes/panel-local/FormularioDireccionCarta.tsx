"use client";

import { useActionState, useState } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { CampoDireccion, type ComprobarDireccion } from "./CampoDireccion";
import type { EstadoVisible } from "./direccion";
import { mensajeCampo } from "./errores";
import { MensajeGuardado } from "./MensajeGuardado";

const t = panelLocalEs.local.slug;

/** Bloque «Dirección de la carta»: con aviso de que los QR impresos seguirán funcionando. */
export function FormularioDireccionCarta({
  slugActual,
  urlBase,
  guardar,
  comprobar,
}: {
  slugActual: string;
  urlBase: string;
  guardar: (previo: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
  comprobar: ComprobarDireccion;
}) {
  const [estado, accion] = useActionState(guardar, null);
  const [valor, setValor] = useState(slugActual);
  const [estadoSlug, setEstadoSlug] = useState<EstadoVisible>("libre");
  const puedeGuardar = valor !== slugActual && estadoSlug === "libre";

  return (
    <Tarjeta aria-labelledby="bloque-slug">
      <h2 id="bloque-slug" className="mb-4 text-xl">
        {t.titulo}
      </h2>
      <form action={accion} className="space-y-4">
        <CampoDireccion
          valor={valor}
          onCambiar={setValor}
          comprobar={comprobar}
          urlBase={urlBase}
          etiqueta={t.campo}
          ayuda=""
          omitir={slugActual}
          onEstado={setEstadoSlug}
          errorServidor={mensajeCampo(estado, "slug")}
        />
        <Aviso variante="aviso" sinRol>
          {t.aviso}
        </Aviso>
        <MensajeGuardado estado={estado} />
        <BotonEnviar bloque disabled={!puedeGuardar}>
          {t.guardar}
        </BotonEnviar>
      </form>
    </Tarjeta>
  );
}
