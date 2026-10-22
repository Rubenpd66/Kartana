"use client";

import { useActionState } from "react";
import { AreaTexto } from "@/componentes/ui/AreaTexto";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { Campo } from "@/componentes/ui/Campo";
import { Casilla } from "@/componentes/ui/Casilla";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { LIMITES } from "@/lib/dominio/limites";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { mensajeCampo } from "./errores";
import { MensajeGuardado } from "./MensajeGuardado";

const t = panelLocalEs.local.datos;

export type DatosLocal = {
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  permitirIndexar: boolean;
};

/** Bloque «Datos del bar»: se guarda por separado del resto. */
export function FormularioDatosLocal({
  inicial,
  guardar,
}: {
  inicial: DatosLocal;
  guardar: (previo: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
}) {
  const [estado, accion] = useActionState(guardar, null);
  return (
    <Tarjeta aria-labelledby="bloque-datos">
      <h2 id="bloque-datos" className="mb-4 text-xl">
        {t.titulo}
      </h2>
      <form action={accion} className="space-y-4">
        <Campo name="nombre" etiqueta={t.nombre} defaultValue={inicial.nombre} maxLength={LIMITES.nombreLocal} required error={mensajeCampo(estado, "nombre")} />
        <AreaTexto
          name="descripcion"
          etiqueta={t.descripcion}
          ayuda={t.descripcionAyuda}
          defaultValue={inicial.descripcion ?? ""}
          maxLength={LIMITES.descripcionLocal}
          rows={2}
          error={mensajeCampo(estado, "descripcion")}
        />
        <Campo name="direccion" etiqueta={t.direccion} defaultValue={inicial.direccion ?? ""} maxLength={LIMITES.direccion} autoComplete="street-address" error={mensajeCampo(estado, "direccion")} />
        <Campo
          name="telefono"
          type="tel"
          inputMode="tel"
          etiqueta={t.telefono}
          defaultValue={inicial.telefono ?? ""}
          maxLength={LIMITES.telefono}
          autoComplete="tel"
          error={mensajeCampo(estado, "telefono")}
        />
        <Casilla name="permitirIndexar" etiqueta={t.indexar} ayuda={t.indexarAyuda} defaultChecked={inicial.permitirIndexar} />
        <MensajeGuardado estado={estado} />
        <BotonEnviar bloque>{t.guardar}</BotonEnviar>
      </form>
    </Tarjeta>
  );
}
