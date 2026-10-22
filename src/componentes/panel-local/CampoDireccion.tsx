"use client";

import { useEffect, useId, useState } from "react";
import { CLASES_ENTRADA } from "@/componentes/ui/Campo";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import { comprobacionLocal, direccionPublica, type EstadoDireccion, type EstadoVisible } from "./direccion";

const t = panelLocalEs.bienvenida;
const ESPERA_MS = 400;

export type ComprobarDireccion = (slug: string) => Promise<EstadoDireccion>;

/**
 * Estado de una dirección mientras se escribe: formato y reservadas al instante; «libre/ocupada»
 * preguntando al servidor con un antirrebote de 400 ms. `omitir` = dirección que ya es la del local.
 */
export function useEstadoDireccion(slug: string, comprobar: ComprobarDireccion, omitir?: string): EstadoVisible {
  const [respuesta, setRespuesta] = useState<{ slug: string; estado: EstadoDireccion } | null>(null);
  const local = comprobacionLocal(slug);
  const preguntar = local === null && slug !== omitir;

  useEffect(() => {
    if (!preguntar) return;
    let vigente = true;
    const temporizador = setTimeout(async () => {
      let estado: EstadoDireccion;
      try {
        estado = await comprobar(slug);
      } catch {
        estado = "error";
      }
      if (vigente) setRespuesta({ slug, estado });
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [slug, preguntar, comprobar]);

  if (local) return local;
  if (slug === omitir) return "libre";
  return respuesta?.slug === slug ? respuesta.estado : "comprobando";
}

const MENSAJES: Record<EstadoVisible, string> = {
  vacio: "",
  comprobando: t.comprobando,
  libre: t.libre,
  ocupado: t.ocupado,
  reservado: t.reservado,
  formato: t.formato,
  error: panelLocalEs.errores.error_servidor,
};

/** Campo de dirección de la carta con comprobación en directo y la dirección final debajo. */
export function CampoDireccion({
  valor,
  onCambiar,
  comprobar,
  urlBase,
  etiqueta = t.direccion,
  ayuda = t.direccionAyuda,
  omitir,
  onEstado,
  errorServidor,
}: {
  valor: string;
  onCambiar: (slug: string) => void;
  comprobar: ComprobarDireccion;
  urlBase: string;
  etiqueta?: string;
  ayuda?: string;
  omitir?: string;
  onEstado?: (estado: EstadoVisible) => void;
  errorServidor?: string | null;
}) {
  const id = useId();
  const estado = useEstadoDireccion(valor, comprobar, omitir);
  useEffect(() => onEstado?.(estado), [estado, onEstado]);
  const malo = estado === "ocupado" || estado === "reservado" || estado === "formato" || estado === "error";
  const mensaje = errorServidor ?? MENSAJES[estado];

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold">
        {etiqueta}
      </label>
      <p id={`${id}-ayuda`} className="-mt-1 mb-1.5 text-sm text-texto-suave">
        {ayuda}
      </p>
      <input
        id={id}
        name="slug"
        value={valor}
        onChange={(e) => onCambiar(e.target.value.toLowerCase())}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={malo || errorServidor ? true : undefined}
        aria-describedby={`${id}-ayuda ${id}-estado`}
        className={CLASES_ENTRADA}
      />
      <p className="mt-1.5 break-all text-sm text-texto-suave">
        {t.direccionFinal} <strong className="text-texto">{direccionPublica(urlBase, valor || "…")}</strong>
      </p>
      <p
        id={`${id}-estado`}
        role="status"
        aria-live="polite"
        className={`mt-1 min-h-5 text-sm font-medium ${malo || errorServidor ? "text-peligro" : estado === "libre" ? "text-exito" : "text-texto-suave"}`}
      >
        {mensaje}
      </p>
    </div>
  );
}
