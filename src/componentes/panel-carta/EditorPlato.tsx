"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { AreaTexto } from "@/componentes/ui/AreaTexto";
import { Aviso } from "@/componentes/ui/Aviso";
import { Boton } from "@/componentes/ui/Boton";
import { Campo } from "@/componentes/ui/Campo";
import { ConfirmarBorrado } from "@/componentes/ui/ConfirmarBorrado";
import { Interruptor } from "@/componentes/ui/Interruptor";
import { Selector } from "@/componentes/ui/Selector";
import { SubirImagen } from "@/componentes/ui/SubirImagen";
import { rutaNuevaFotoPlato } from "@/lib/dominio/imagenes";
import { LIMITES } from "@/lib/dominio/limites";
import { panelCartaEs, textoCampo } from "@/lib/i18n/panel-carta.es";
import type { Plato } from "@/lib/tipos/carta";
import type { CodigoAlergeno } from "@/lib/tipos/dominio";
import type { Resultado } from "@/lib/tipos/resultado";
import { EditorPrecios } from "./EditorPrecios";
import { validarFormularioPlato } from "./formulario-plato";
import { SelectorAlergenos } from "./SelectorAlergenos";
import { SelectorEtiquetas } from "./SelectorEtiquetas";

const t = panelCartaEs.plato;

export type AccionesEditorPlato = {
  guardar: (fd: FormData) => Promise<Resultado<{ platoId: string }>>;
  borrar: (localId: string, platoId: string) => Promise<Resultado>;
};

/**
 * Editor de un plato (nuevo o existente). Valida en el navegador con el mismo esquema que el servidor
 * y envía el formulario a la acción `guardar`, que vuelve a la lista si todo va bien.
 * - Plato nuevo: el id se genera en el navegador al abrir (para subir la foto a su carpeta) y se envía con esNuevo.
 */
export function EditorPlato({
  localId,
  plato,
  seccionInicial,
  secciones,
  urlFoto,
  acciones,
}: {
  localId: string;
  plato: Plato | null;
  seccionInicial: string;
  secciones: Array<{ id: string; nombre: string }>;
  urlFoto: string | null;
  acciones: AccionesEditorPlato;
}) {
  const esNuevo = plato === null;
  // Solo se usa en manejadores y al enviar (no se pinta), así que no descuadra la hidratación.
  const [platoId] = useState(() => plato?.id ?? crypto.randomUUID());
  const [fotoRuta, setFotoRuta] = useState<string | null>(plato?.fotoRuta ?? null);
  const [alergenos, setAlergenos] = useState<CodigoAlergeno[]>(plato?.alergenos ?? []);
  const [confirmados, setConfirmados] = useState(plato?.alergenosConfirmados ?? false);
  const [descripcion, setDescripcion] = useState(plato?.descripcion ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const formulario = useRef<HTMLFormElement>(null);

  function enfocarPrimerError() {
    requestAnimationFrame(() => formulario.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const fd = new FormData(evento.currentTarget);
    fd.set("platoId", platoId);
    fd.set("esNuevo", esNuevo ? "true" : "false");
    const { errores: encontrados } = validarFormularioPlato(fd);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setMensaje(panelCartaEs.comun.revisaCampos);
      enfocarPrimerError();
      return;
    }
    setMensaje(null);
    iniciar(async () => {
      const r = await acciones.guardar(fd);
      // Si sale bien, la acción redirige a la lista y no se llega aquí.
      if (!r.ok) {
        setErrores(r.campos ?? {});
        setMensaje(panelCartaEs.errores[r.error]);
        enfocarPrimerError();
      }
    });
  }

  async function borrar() {
    const r = await acciones.borrar(localId, platoId);
    if (!r.ok) setMensaje(panelCartaEs.errores[r.error]);
  }

  return (
    <form ref={formulario} onSubmit={enviar} noValidate className="space-y-7 pb-28">
      <input type="hidden" name="localId" value={localId} />

      <div className="space-y-4">
        <Campo
          etiqueta={t.nombre}
          name="nombre"
          defaultValue={plato?.nombre ?? ""}
          maxLength={LIMITES.nombrePlato}
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
          ayuda={panelCartaEs.comun.caracteres(descripcion.length, LIMITES.descripcionPlato)}
          name="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={LIMITES.descripcionPlato}
          error={textoCampo(errores.descripcion)}
        />
        <Selector
          etiqueta={t.seccion}
          name="seccionId"
          defaultValue={seccionInicial}
          opciones={secciones.map((s) => ({ valor: s.id, etiqueta: s.nombre }))}
          error={textoCampo(errores.seccionId)}
        />
      </div>

      <section>
        <h2 className="mb-2 font-sans text-[1.0625rem] font-bold">
          {t.precio}
        </h2>
        <EditorPrecios inicial={plato?.precios ?? []} errores={errores} />
        {errores.precios ? <p className="mt-1.5 text-sm font-medium text-peligro">{textoCampo(errores.precios)}</p> : null}
      </section>

      <section aria-labelledby="titulo-alergenos">
        <h2 id="titulo-alergenos" className="font-sans text-[1.0625rem] font-bold">
          {t.alergenos}
        </h2>
        <p className="mb-2 text-sm text-texto-suave">{t.alergenosAyuda}</p>
        <SelectorAlergenos etiqueta={t.alergenos} name="alergenos" valor={alergenos} onCambiar={setAlergenos} />
        <label
          className={`mt-3 flex min-h-12 cursor-pointer items-start gap-3 rounded-[14px] px-4 py-3 font-semibold ${
            confirmados ? "bg-exito/10 text-exito" : "bg-aviso/10 text-aviso"
          }`}
        >
          <input
            type="checkbox"
            name="alergenosConfirmados"
            value="true"
            checked={confirmados}
            onChange={(e) => setConfirmados(e.target.checked)}
            className="mt-0.5 size-6 shrink-0 cursor-pointer accent-exito"
          />
          <span>
            {t.confirmar}
            <span className="block text-sm font-normal">
              {!confirmados ? t.sinConfirmar : alergenos.length === 0 ? t.confirmarAyudaVacio : null}
            </span>
          </span>
        </label>
        <details className="mt-3 rounded-[14px] border border-borde" open={(plato?.trazas.length ?? 0) > 0}>
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold">{t.trazas}</summary>
          <div className="px-3 pb-3">
            <p className="mb-2 text-sm text-texto-suave">{t.trazasAyuda}</p>
            <SelectorAlergenos etiqueta={panelCartaEs.alergenos.trazas} name="trazas" inicial={plato?.trazas ?? []} tamano="compacto" />
          </div>
        </details>
      </section>

      <section aria-labelledby="titulo-etiquetas">
        <h2 id="titulo-etiquetas" className="mb-2 font-sans text-[1.0625rem] font-bold">
          {t.etiquetas}
        </h2>
        <SelectorEtiquetas etiqueta={t.etiquetas} name="etiquetas" inicial={plato?.etiquetas ?? []} />
      </section>

      <section>
        <SubirImagen
          tipo="foto"
          etiqueta={`${t.foto} ${panelCartaEs.comun.opcional}`}
          rutaActual={fotoRuta}
          urlActual={urlFoto}
          generarRuta={() => rutaNuevaFotoPlato(localId, platoId)}
          onSubida={setFotoRuta}
          onQuitar={() => setFotoRuta(null)}
        />
        <input type="hidden" name="fotoRuta" value={fotoRuta ?? ""} />
        {errores.fotoRuta ? <p className="mt-1.5 text-sm font-medium text-peligro">{textoCampo(errores.fotoRuta)}</p> : null}
      </section>

      <section>
        <Interruptor etiqueta={t.visible} descripcion={t.visibleAyuda} name="visible" valorInicial={plato?.visible ?? true} />
      </section>

      {!esNuevo ? (
        <section>
          <ConfirmarBorrado etiquetaBoton={t.borrar} titulo={t.borrarTitulo(plato.nombre)} descripcion={t.borrarTexto} onConfirmar={borrar} />
        </section>
      ) : null}

      {mensaje ? <Aviso variante="error">{mensaje}</Aviso> : null}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-borde bg-superficie py-3 lg:bottom-0 lg:left-56">
        <Contenedor ancho="estrecho">
          <Boton type="submit" tamano="grande" bloque cargando={enviando}>
            {enviando ? panelCartaEs.comun.guardando : panelCartaEs.comun.guardar}
          </Boton>
        </Contenedor>
      </div>
    </form>
  );
}
