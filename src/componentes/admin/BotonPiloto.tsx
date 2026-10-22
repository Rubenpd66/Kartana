"use client";

import { useState, useTransition } from "react";
import { activarPilotoAccion, cambiarEstadoAccion } from "@/app/(admin)/admin/acciones";
import { Aviso } from "@/componentes/ui/Aviso";
import { Boton } from "@/componentes/ui/Boton";
import { ConfirmarBorrado } from "@/componentes/ui/ConfirmarBorrado";
import { adminEs as t } from "@/lib/i18n/admin.es";
import type { EstadoAcceso } from "@/lib/tipos/cuentas";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import type { AccesoEfectivo } from "@/lib/tipos/cuentas";
import { textoVencimiento } from "./formato";

type Props = { localId: string; nombre: string; estado: EstadoAcceso };

/** Botones de acceso de un local: piloto, cortesía y quitar acceso. Un aviso (aria-live) dice el resultado. */
export function AccionesLocal({ localId, nombre, estado }: Props) {
  const [pendiente, iniciar] = useTransition();
  const [activa, setActiva] = useState<"piloto" | "cortesia" | null>(null);
  const [resultado, setResultado] = useState<EstadoFormulario<AccesoEfectivo>>(null);

  function lanzar(cual: "piloto" | "cortesia" | "vencido") {
    return async () => {
      setResultado(null);
      const r = cual === "piloto" ? await activarPilotoAccion(localId) : await cambiarEstadoAccion(localId, cual);
      setResultado(r);
    };
  }

  function ejecutar(cual: "piloto" | "cortesia") {
    setActiva(cual);
    iniciar(async () => {
      await lanzar(cual)();
      setActiva(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Boton
          variante={estado === "piloto" ? "secundario" : "primario"}
          onClick={() => ejecutar("piloto")}
          cargando={pendiente && activa === "piloto"}
          disabled={pendiente}
        >
          {estado === "piloto" ? t.acciones.renovarPiloto : t.acciones.activarPiloto}
        </Boton>
        {estado !== "cortesia" ? (
          <Boton
            variante="secundario"
            onClick={() => ejecutar("cortesia")}
            cargando={pendiente && activa === "cortesia"}
            disabled={pendiente}
          >
            {t.acciones.darCortesia}
          </Boton>
        ) : null}
        {estado !== "vencido" ? (
          <ConfirmarBorrado
            etiquetaBoton={t.acciones.quitarAcceso}
            titulo={t.acciones.confirmarQuitarTitulo(nombre)}
            descripcion={t.acciones.confirmarQuitarTexto}
            etiquetaConfirmar={t.acciones.confirmarQuitar}
            onConfirmar={lanzar("vencido")}
          />
        ) : null}
      </div>
      <div aria-live="polite">
        {resultado?.ok ? (
          <Aviso variante="exito">{t.acciones.hecho(nombre, textoVencimiento(resultado.datos))}</Aviso>
        ) : resultado ? (
          <Aviso variante="error">{t.errores[resultado.error as keyof typeof t.errores] ?? t.errores.error_servidor}</Aviso>
        ) : null}
      </div>
    </div>
  );
}
