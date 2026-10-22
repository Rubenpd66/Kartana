"use client";

import { useId, useState } from "react";
import { CLASES_ENTRADA } from "@/componentes/ui/Campo";
import { LIMITES } from "@/lib/dominio/limites";
import { FORMATOS_PRECIO } from "@/lib/dominio/precios";
import { cartaEs } from "@/lib/i18n/carta.es";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import type { FormatoPrecio, Precio } from "@/lib/tipos/dominio";
import { FlechasOrden } from "./FlechasOrden";
import { mover } from "./orden";
import { aplicarAtajo, ATAJOS, centimosATexto, formatosDeAtajo, type Atajo } from "./precios";

const t = panelCartaEs.precios;
const MAXIMO = LIMITES.preciosPorPlato;

type Fila = { clave: number; id?: string; formato: FormatoPrecio; texto: string; importe: string; mercado: boolean };

/** Formatos con nombre del diccionario (sin «unico» ni «otro», que van aparte en el selector). */
const FORMATOS_CON_NOMBRE = FORMATOS_PRECIO.filter((f) => f !== "unico" && f !== "otro");

/** Clave nueva para React y para los ids (no se repite con las filas actuales). */
const siguienteClave = (filas: Fila[]) => filas.reduce((max, f) => Math.max(max, f.clave), -1) + 1;

function nombreFila(fila: Fila, indice: number): string {
  if (fila.formato === "otro") return fila.texto.trim() || t.variante(indice + 1);
  if (fila.formato === "unico") return t.variante(indice + 1);
  return cartaEs.formatos[fila.formato];
}

/** Texto del error de una fila (los códigos vienen de leerPrecios o de Zod). */
function errorDeFila(errores: Record<string, string>, i: number): string | null {
  const importe = errores[`precios.${i}.centimos`];
  if (importe) return importe === "requerido" ? t.errores.importeVacio : importe === "fuera_de_rango" ? panelCartaEs.campos.fuera_de_rango : t.errores.importe;
  if (errores[`precios.${i}.texto`]) return t.errores.texto;
  const formato = errores[`precios.${i}.formato`];
  if (formato) return formato === "duplicado" ? t.errores.duplicado : t.errores.sinEtiqueta;
  return null;
}

/**
 * Variantes de precio de un plato. Por defecto, un solo campo «Precio» (formato «unico»).
 * Envía en el formulario `precios.<i>.formato|id|texto|importe|mercado` (lo lee `leerPrecios`).
 * `errores`: errores por campo del formulario («precios.0.centimos»…), ya sea del navegador o del servidor.
 */
export function EditorPrecios({ inicial, errores = {} }: { inicial: Precio[]; errores?: Record<string, string> }) {
  const prefijo = useId();
  const [filas, setFilas] = useState<Fila[]>(() =>
    (inicial.length > 0 ? inicial : [{ id: undefined, formato: "unico" as const, texto: null, centimos: null }]).map((p, i) => ({
      clave: i,
      id: p.id,
      formato: p.formato,
      texto: p.texto ?? "",
      importe: centimosATexto(p.centimos),
      // Un plato nuevo empieza con el precio vacío, no «según mercado».
      mercado: inicial.length > 0 && p.centimos === null,
    })),
  );

  const simple = filas.length === 1 && filas[0].formato === "unico";
  const lleno = filas.length >= MAXIMO;

  function cambiar(clave: number, cambios: Partial<Fila>) {
    setFilas((actuales) => actuales.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)));
  }

  function usarAtajo(atajo: Atajo) {
    setFilas((actuales) => {
      let clave = siguienteClave(actuales);
      return aplicarAtajo(atajo).map((p) => {
        // Si ya había una fila con ese formato, se conserva (con su id y su precio).
        const previa = actuales.find((f) => f.formato === p.formato);
        if (previa) return previa;
        // Al pasar de un precio a otro formato, el importe escrito no se pierde.
        const unica = actuales.length === 1 && formatosDeAtajo(atajo).length === 1 ? actuales[0] : null;
        return { clave: clave++, formato: p.formato, texto: "", importe: unica?.importe ?? "", mercado: unica?.mercado ?? false };
      });
    });
  }

  function anadir() {
    setFilas((actuales) => {
      if (actuales.length >= MAXIMO) return actuales;
      const usados = new Set(actuales.map((f) => f.formato));
      const formato = FORMATOS_CON_NOMBRE.find((f) => !usados.has(f)) ?? "otro";
      return [...actuales, { clave: siguienteClave(actuales), formato, texto: "", importe: "", mercado: false }];
    });
  }

  function quitar(clave: number) {
    setFilas((actuales) => (actuales.length > 1 ? actuales.filter((f) => f.clave !== clave) : actuales));
  }

  function atajoActivo(atajo: Atajo) {
    const formatos = formatosDeAtajo(atajo);
    return formatos.length === filas.length && formatos.every((f, i) => filas[i].formato === f);
  }

  return (
    <div className="space-y-3">
      {filas.map((fila, i) => {
        const nombre = nombreFila(fila, i);
        const error = errorDeFila(errores, i);
        const idBase = `${prefijo}-precio-${fila.clave}`;
        const idError = `${idBase}-error`;
        const entradaImporte = (
          <div className="relative">
            {simple ? (
              <label htmlFor={`${idBase}-importe`} className="mb-1.5 block font-semibold">
                {t.precio}
              </label>
            ) : (
              <label htmlFor={`${idBase}-importe`} className="sr-only">
                {fila.formato === "unico" ? t.precioVariante(i + 1) : t.precioDe(nombre)}
              </label>
            )}
            <div className="relative">
              <input
                id={`${idBase}-importe`}
                name={`precios.${i}.importe`}
                inputMode="decimal"
                autoComplete="off"
                value={fila.importe}
                disabled={fila.mercado}
                onChange={(e) => cambiar(fila.clave, { importe: e.target.value })}
                aria-invalid={error && errores[`precios.${i}.centimos`] ? true : undefined}
                aria-describedby={error ? idError : undefined}
                className={`${CLASES_ENTRADA} pr-9 text-right text-lg font-bold`}
              />
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-texto-suave">
                {t.euro}
              </span>
            </div>
          </div>
        );

        return (
          <div key={fila.clave} className={simple ? "" : "rounded-[14px] border border-borde p-3"}>
            {fila.id ? <input type="hidden" name={`precios.${i}.id`} value={fila.id} /> : null}
            {simple ? (
              <>
                <input type="hidden" name={`precios.${i}.formato`} value="unico" />
                <div className="max-w-56">{entradaImporte}</div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_3rem] items-center gap-2">
                  <select
                    name={`precios.${i}.formato`}
                    aria-label={t.formato(i + 1)}
                    value={fila.formato}
                    onChange={(e) => cambiar(fila.clave, { formato: e.target.value as FormatoPrecio })}
                    aria-invalid={errores[`precios.${i}.formato`] ? true : undefined}
                    className={`${CLASES_ENTRADA} cursor-pointer px-3`}
                  >
                    <option value="unico" disabled={filas.length > 1}>
                      {t.sinEtiqueta}
                    </option>
                    {FORMATOS_CON_NOMBRE.map((f) => (
                      <option key={f} value={f}>
                        {cartaEs.formatos[f]}
                      </option>
                    ))}
                    <option value="otro">{t.otra}</option>
                  </select>
                  {entradaImporte}
                  <button
                    type="button"
                    onClick={() => quitar(fila.clave)}
                    disabled={filas.length === 1}
                    aria-label={t.quitar(nombre)}
                    className="inline-flex size-12 items-center justify-center rounded-xl border border-borde bg-superficie text-xl text-peligro hover:bg-superficie-suave disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                {fila.formato === "otro" ? (
                  <div>
                    <label htmlFor={`${idBase}-texto`} className="sr-only">
                      {t.textoLibre(i + 1)}
                    </label>
                    <input
                      id={`${idBase}-texto`}
                      name={`precios.${i}.texto`}
                      required
                      maxLength={LIMITES.textoFormatoLibre}
                      placeholder={t.textoLibreAyuda}
                      value={fila.texto}
                      onChange={(e) => cambiar(fila.clave, { texto: e.target.value })}
                      aria-invalid={errores[`precios.${i}.texto`] ? true : undefined}
                      className={CLASES_ENTRADA}
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FlechasOrden
                    nombre={nombre}
                    esPrimero={i === 0}
                    esUltimo={i === filas.length - 1}
                    onMover={(delta) => setFilas((actuales) => mover(actuales, i, delta))}
                  />
                  <CasillaMercado fila={fila} i={i} onCambiar={(mercado) => cambiar(fila.clave, { mercado })} />
                </div>
              </div>
            )}
            {simple ? <CasillaMercado fila={fila} i={i} onCambiar={(mercado) => cambiar(fila.clave, { mercado })} /> : null}
            {error ? (
              <p id={idError} role="alert" className="mt-1.5 text-sm font-medium text-peligro">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}

      <div>
        <p className="text-sm text-texto-suave">{t.atajos}</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {ATAJOS.map((atajo) => (
            <button
              key={atajo}
              type="button"
              onClick={() => usarAtajo(atajo)}
              aria-pressed={atajoActivo(atajo)}
              className="min-h-12 rounded-full border border-borde bg-superficie px-4 text-[0.9375rem] font-semibold hover:bg-superficie-suave aria-pressed:border-primario aria-pressed:text-primario"
            >
              {t.atajo[atajo]}
            </button>
          ))}
          <button
            type="button"
            onClick={anadir}
            disabled={lleno}
            className="min-h-12 rounded-full border border-dashed border-borde bg-superficie px-4 text-[0.9375rem] font-semibold text-primario hover:bg-superficie-suave disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.otraVariante}
          </button>
        </div>
        {lleno ? <p className="mt-1.5 text-sm text-texto-suave">{t.maximo(MAXIMO)}</p> : null}
      </div>
    </div>
  );
}

function CasillaMercado({ fila, i, onCambiar }: { fila: Fila; i: number; onCambiar: (valor: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-2 text-[0.9375rem] text-texto-suave">
      <input
        type="checkbox"
        name={`precios.${i}.mercado`}
        value="true"
        checked={fila.mercado}
        onChange={(e) => onCambiar(e.target.checked)}
        className="size-5 cursor-pointer accent-primario"
      />
      <span>
        {t.segunMercado} <span className="text-sm">({t.segunMercadoAyuda})</span>
      </span>
    </label>
  );
}
