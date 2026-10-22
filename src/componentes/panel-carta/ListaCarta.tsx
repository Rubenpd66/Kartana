"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { Boton, clasesBoton } from "@/componentes/ui/Boton";
import { Insignia } from "@/componentes/ui/Insignia";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import type { EntradaAgotado, EntradaOrden, Plato, Seccion } from "@/lib/tipos/carta";
import type { Resultado } from "@/lib/tipos/resultado";
import { EditorSeccion, type AccionesSeccion } from "./EditorSeccion";
import { FilaPlato } from "./FilaPlato";
import { FlechasOrden } from "./FlechasOrden";
import { mover } from "./orden";

const t = panelCartaEs.lista;

type SeccionConPlatos = Seccion & { platos: Plato[] };

export type AccionesListaCarta = AccionesSeccion & {
  cambiarAgotado: (entrada: EntradaAgotado) => Promise<Resultado>;
  reordenar: (entrada: EntradaOrden) => Promise<Resultado>;
};

type CambioOrden = { tabla: "secciones"; ids: string[] } | { tabla: "platos"; seccionId: string; ids: string[] };

/** Aplica un orden nuevo (lista de ids) a la carta, sin tocar la original. */
export function aplicarOrden(secciones: SeccionConPlatos[], cambio: CambioOrden): SeccionConPlatos[] {
  const ordenar = <T extends { id: string }>(lista: T[]) =>
    cambio.ids.map((id) => lista.find((x) => x.id === id)).filter((x): x is T => Boolean(x));
  if (cambio.tabla === "secciones") return ordenar(secciones);
  return secciones.map((s) => (s.id === cambio.seccionId ? { ...s, platos: ordenar(s.platos) } : s));
}

/**
 * Lista de la carta del panel: secciones plegables, platos con «Agotado» de un toque,
 * modo «Ordenar» con flechas (se guarda al momento) y alta/edición de secciones en un diálogo.
 */
export function ListaCarta({
  localId,
  secciones,
  acciones,
  guardado = null,
  borrado = false,
}: {
  localId: string;
  secciones: SeccionConPlatos[];
  acciones: AccionesListaCarta;
  /** Id del plato recién guardado: se avisa y se lleva la vista hasta él. */
  guardado?: string | null;
  borrado?: boolean;
}) {
  const [vistas, cambiarOrden] = useOptimistic(secciones, aplicarOrden);
  const [ordenando, setOrdenando] = useState(false);
  const [plegadas, setPlegadas] = useState<ReadonlySet<string>>(new Set());
  const [editando, setEditando] = useState<SeccionConPlatos | "nueva" | null>(null);
  const [errorOrden, setErrorOrden] = useState(false);
  const [, iniciar] = useTransition();

  const platoGuardado = guardado ? vistas.flatMap((s) => s.platos).find((p) => p.id === guardado) : undefined;

  useEffect(() => {
    if (guardado) document.getElementById(`plato-${guardado}`)?.scrollIntoView({ block: "center" });
  }, [guardado]);

  function reordenar(cambio: CambioOrden) {
    setErrorOrden(false);
    iniciar(async () => {
      cambiarOrden(cambio);
      const r = await acciones.reordenar({ localId, tabla: cambio.tabla, ids: cambio.ids });
      if (!r.ok) setErrorOrden(true);
    });
  }

  function alternarPlegada(id: string) {
    setPlegadas((actual) => {
      const nueva = new Set(actual);
      if (nueva.has(id)) nueva.delete(id);
      else nueva.add(id);
      return nueva;
    });
  }

  const rutaPlato = (id: string) => `/panel/${localId}/carta/plato/${id}`;
  const rutaNuevo = (seccionId: string) => `/panel/${localId}/carta/plato/nuevo?seccion=${seccionId}`;
  const hayQueOrdenar = vistas.length > 1 || vistas.some((s) => s.platos.length > 1);

  return (
    <div>
      <div className="mt-3 mb-4 flex flex-wrap gap-2">
        <Link href={`/panel/${localId}/vista-previa`} className={clasesBoton({ variante: "secundario" })}>
          {t.verCarta}
        </Link>
        {hayQueOrdenar ? (
          <button
            type="button"
            aria-pressed={ordenando}
            onClick={() => setOrdenando((o) => !o)}
            className={`${clasesBoton({ variante: "secundario" })} aria-pressed:border-primario aria-pressed:text-primario`}
          >
            {ordenando ? t.terminarOrden : t.ordenar}
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        {platoGuardado ? <Aviso variante="exito">{t.guardadoPlato(platoGuardado.nombre)}</Aviso> : null}
        {borrado ? <Aviso variante="exito">{t.borradoPlato}</Aviso> : null}
        {ordenando ? <p className="text-sm text-texto-suave">{t.ayudaOrden}</p> : null}
        {errorOrden ? <Aviso variante="error">{t.errorOrden}</Aviso> : null}
      </div>

      {vistas.length === 0 ? (
        <Tarjeta relleno="grande" className="mt-4 text-center" aria-labelledby="titulo-vacio">
          <h2 id="titulo-vacio" className="text-xl">
            {t.vacioTitulo}
          </h2>
          <p className="mt-2 text-texto-suave">{t.vacioTexto}</p>
          <Boton className="mt-4" onClick={() => setEditando("nueva")}>
            {t.vacioBoton}
          </Boton>
        </Tarjeta>
      ) : (
        <ul className="space-y-4">
          {vistas.map((seccion, i) => {
            const abierta = !plegadas.has(seccion.id);
            const idLista = `platos-${seccion.id}`;
            return (
              <li key={seccion.id} aria-labelledby={`titulo-${seccion.id}`}>
                <div className="flex min-h-14 items-center gap-2 rounded-[14px] bg-superficie-suave px-2 py-1.5">
                  {ordenando ? (
                    <FlechasOrden
                      nombre={seccion.nombre}
                      esPrimero={i === 0}
                      esUltimo={i === vistas.length - 1}
                      onMover={(delta) => reordenar({ tabla: "secciones", ids: mover(vistas, i, delta).map((s) => s.id) })}
                    />
                  ) : null}
                  <h2 id={`titulo-${seccion.id}`} className="min-w-0 flex-1 text-xl">
                    <button
                      type="button"
                      aria-expanded={abierta}
                      aria-controls={idLista}
                      onClick={() => alternarPlegada(seccion.id)}
                      className="flex min-h-12 w-full items-center gap-2 text-left"
                    >
                      <span aria-hidden="true" className={`text-base text-texto-suave transition-transform ${abierta ? "rotate-90" : ""}`}>
                        ▸
                      </span>
                      <span className="min-w-0 break-words">{seccion.nombre}</span>
                    </button>
                  </h2>
                  {!seccion.visible ? <Insignia variante="aviso">{t.oculta}</Insignia> : null}
                  <Insignia>{t.numPlatos(seccion.platos.length)}</Insignia>
                  <Boton variante="fantasma" onClick={() => setEditando(seccion)} aria-label={t.editarSeccion(seccion.nombre)} className="px-3">
                    {t.editar}
                  </Boton>
                </div>

                <div id={idLista} hidden={!abierta}>
                  {seccion.platos.length === 0 ? (
                    <p className="px-1 py-3 text-texto-suave">{t.seccionVacia}</p>
                  ) : (
                    <ul>
                      {seccion.platos.map((plato, j) => (
                        <FilaPlato
                          key={plato.id}
                          plato={plato}
                          href={rutaPlato(plato.id)}
                          ordenando={ordenando}
                          esPrimero={j === 0}
                          esUltimo={j === seccion.platos.length - 1}
                          destacado={plato.id === guardado}
                          onMover={(delta) =>
                            reordenar({ tabla: "platos", seccionId: seccion.id, ids: mover(seccion.platos, j, delta).map((p) => p.id) })
                          }
                          onCambiarAgotado={(agotado) => acciones.cambiarAgotado({ localId, platoId: plato.id, agotado })}
                        />
                      ))}
                    </ul>
                  )}
                  <Link
                    href={rutaNuevo(seccion.id)}
                    className="mt-2 flex min-h-13 items-center justify-center rounded-[14px] border-2 border-dashed border-borde px-3 text-center font-semibold text-primario no-underline hover:bg-superficie-suave"
                  >
                    {t.anadirPlato(seccion.nombre)}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {vistas.length > 0 ? (
        <button
          type="button"
          onClick={() => setEditando("nueva")}
          className="mt-5 flex min-h-13 w-full items-center justify-center rounded-[14px] border-2 border-dashed border-borde font-semibold text-primario hover:bg-superficie-suave"
        >
          {t.nuevaSeccion}
        </button>
      ) : null}

      {editando ? (
        <EditorSeccion
          localId={localId}
          seccion={editando === "nueva" ? null : editando}
          numPlatos={editando === "nueva" ? 0 : editando.platos.length}
          acciones={acciones}
          onCerrar={() => setEditando(null)}
        />
      ) : null}
    </div>
  );
}
