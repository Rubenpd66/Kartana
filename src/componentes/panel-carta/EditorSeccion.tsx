"use client";

import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { AreaTexto } from "@/componentes/ui/AreaTexto";
import { Aviso } from "@/componentes/ui/Aviso";
import { Boton } from "@/componentes/ui/Boton";
import { Campo } from "@/componentes/ui/Campo";
import { ConfirmarBorrado } from "@/componentes/ui/ConfirmarBorrado";
import { Interruptor } from "@/componentes/ui/Interruptor";
import { LIMITES } from "@/lib/dominio/limites";
import { panelCartaEs, textoCampo } from "@/lib/i18n/panel-carta.es";
import type { EntradaSeccion, Seccion } from "@/lib/tipos/carta";
import type { Resultado } from "@/lib/tipos/resultado";
import { esquemaSeccion } from "@/lib/validacion/carta";
import { erroresPorCampo } from "@/lib/validacion/comun";

const t = panelCartaEs.seccion;

export type AccionesSeccion = {
  guardar: (entrada: EntradaSeccion) => Promise<Resultado<{ seccionId: string }>>;
  borrar: (localId: string, seccionId: string) => Promise<Resultado>;
};

/**
 * Crear o editar una sección en un `<dialog>` modal (se abre al montarlo; Esc o «Cancelar» lo cierran).
 * `numPlatos` sirve para avisar de cuántos platos se borran con la sección.
 */
export function EditorSeccion({
  localId,
  seccion,
  numPlatos = 0,
  acciones,
  onCerrar,
}: {
  localId: string;
  seccion: Seccion | null;
  numPlatos?: number;
  acciones: AccionesSeccion;
  onCerrar: () => void;
}) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(seccion?.visible ?? true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  function cerrar() {
    dialogo.current?.close();
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const fd = new FormData(evento.currentTarget);
    const entrada: EntradaSeccion = {
      localId,
      nombre: String(fd.get("nombre") ?? ""),
      descripcion: String(fd.get("descripcion") ?? ""),
      visible,
    };
    if (seccion) entrada.seccionId = seccion.id;
    const validado = esquemaSeccion.safeParse(entrada);
    if (!validado.success) {
      setErrores(erroresPorCampo(validado.error));
      return;
    }
    setErrores({});
    setMensaje(null);
    iniciar(async () => {
      const r = await acciones.guardar(entrada);
      if (r.ok) cerrar();
      else {
        setErrores(r.campos ?? {});
        setMensaje(panelCartaEs.errores[r.error]);
      }
    });
  }

  async function borrar() {
    if (!seccion) return;
    const r = await acciones.borrar(localId, seccion.id);
    if (r.ok) cerrar();
    else setMensaje(panelCartaEs.errores[r.error]);
  }

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      aria-labelledby={`${id}-titulo`}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-[22px] border border-borde bg-superficie p-6 text-texto backdrop:bg-texto/50"
    >
      <h2 id={`${id}-titulo`} className="text-xl">
        {seccion ? t.tituloEditar : t.tituloNueva}
      </h2>
      <form onSubmit={enviar} noValidate className="mt-4 space-y-4">
        <Campo
          etiqueta={t.nombre}
          ayuda={t.nombreAyuda}
          name="nombre"
          id={`${id}-nombre`}
          defaultValue={seccion?.nombre ?? ""}
          maxLength={LIMITES.nombreSeccion}
          required
          autoComplete="off"
          error={textoCampo(errores.nombre)}
        />
        <AreaTexto
          etiqueta={
            <>
              {t.descripcion} <span className="font-normal text-texto-suave">{panelCartaEs.comun.opcional}</span>
            </>
          }
          name="descripcion"
          id={`${id}-descripcion`}
          rows={2}
          defaultValue={seccion?.descripcion ?? ""}
          maxLength={LIMITES.descripcionSeccion}
          error={textoCampo(errores.descripcion)}
        />
        <Interruptor etiqueta={t.visible} descripcion={t.visibleAyuda} activado={visible} onCambiar={setVisible} />
        {mensaje ? <Aviso variante="error">{mensaje}</Aviso> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton variante="secundario" onClick={cerrar} disabled={enviando}>
            {panelCartaEs.comun.cancelar}
          </Boton>
          <Boton type="submit" cargando={enviando}>
            {panelCartaEs.comun.guardar}
          </Boton>
        </div>
      </form>
      {seccion ? (
        <div className="mt-6 border-t border-borde pt-4">
          <ConfirmarBorrado
            etiquetaBoton={t.borrar}
            titulo={t.borrarTitulo(seccion.nombre)}
            descripcion={t.borrarTexto(numPlatos)}
            onConfirmar={borrar}
          />
        </div>
      ) : null}
    </dialog>
  );
}
