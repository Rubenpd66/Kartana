"use client";

import { useState, useTransition } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { Boton } from "@/componentes/ui/Boton";
import { Casilla } from "@/componentes/ui/Casilla";
import { CLASES_ENTRADA } from "@/componentes/ui/Campo";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { LIMITES } from "@/lib/dominio/limites";
import { resumirHorarios } from "@/lib/dominio/horarios";
import { cartaEs } from "@/lib/i18n/carta.es";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { FranjaHoraria } from "@/lib/tipos/dominio";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { mensajeGeneral } from "./errores";
import {
  abrirDia,
  anadirFranja,
  aFranjas,
  cambiarHora,
  cerrarDia,
  copiarLunesALaborables,
  desdeFranjas,
  DIAS,
  hayFranjaIgual,
  quitarFranja,
} from "./horarios-form";

const t = panelLocalEs.local.horarios;

/** Bloque «Horarios»: los 7 días, cerrado o de 1 a 3 franjas. Convierte el formulario a FranjaHoraria[] al guardar. */
export function EditorHorarios({
  inicial,
  guardar,
}: {
  inicial: FranjaHoraria[];
  guardar: (horarios: FranjaHoraria[]) => Promise<EstadoFormulario>;
}) {
  const [estado, setEstado] = useState(() => desdeFranjas(inicial));
  const [resultado, setResultado] = useState<EstadoFormulario>(null);
  const [pendiente, iniciar] = useTransition();

  const franjas = aFranjas(estado);
  const invalido = hayFranjaIgual(estado);
  const vista = resumirHorarios(franjas, cartaEs);
  const error = mensajeGeneral(resultado);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (invalido) return;
    setResultado(null);
    iniciar(async () => setResultado(await guardar(franjas)));
  }

  return (
    <Tarjeta aria-labelledby="bloque-horarios">
      <h2 id="bloque-horarios" className="mb-4 text-xl">
        {t.titulo}
      </h2>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <ul className="divide-y divide-borde">
          {DIAS.map((dia) => {
            const nombreDia = cartaEs.dias[dia];
            const d = estado[dia];
            return (
              <li key={dia} className="py-2">
                <Casilla
                  name={`dia-${dia}`}
                  etiqueta={<span className="font-semibold">{nombreDia}</span>}
                  ayuda={d.abierto ? undefined : t.cerrado}
                  checked={d.abierto}
                  aria-label={t.estadoDia(nombreDia)}
                  onChange={(e) => setEstado(e.target.checked ? abrirDia(estado, dia) : cerrarDia(estado, dia))}
                />
                {d.abierto ? (
                  <div className="space-y-2 pl-9">
                    {d.franjas.map((f, i) => (
                      <div key={i} className="flex flex-wrap items-end gap-2">
                        <label className="block text-sm">
                          <span className="mb-1 block font-semibold">
                            {t.abre} <span className="sr-only">{`${nombreDia}, ${t.franja(i + 1)}`}</span>
                          </span>
                          <input
                            type="time"
                            value={f.abre}
                            onChange={(e) => setEstado(cambiarHora(estado, dia, i, "abre", e.target.value))}
                            className={`${CLASES_ENTRADA} w-auto`}
                            required
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-1 block font-semibold">
                            {t.cierra} <span className="sr-only">{`${nombreDia}, ${t.franja(i + 1)}`}</span>
                          </span>
                          <input
                            type="time"
                            value={f.cierra}
                            onChange={(e) => setEstado(cambiarHora(estado, dia, i, "cierra", e.target.value))}
                            className={`${CLASES_ENTRADA} w-auto`}
                            required
                          />
                        </label>
                        <Boton variante="fantasma" onClick={() => setEstado(quitarFranja(estado, dia, i))} aria-label={t.quitar(nombreDia, i + 1)}>
                          ✕
                        </Boton>
                      </div>
                    ))}
                    {d.franjas.length < LIMITES.franjasPorDia ? (
                      <Boton variante="secundario" onClick={() => setEstado(anadirFranja(estado, dia))}>
                        {t.anadir}{" "}
                        <span className="sr-only">{nombreDia}</span>
                      </Boton>
                    ) : (
                      <p className="text-sm text-texto-suave">{t.maximo}</p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <Boton variante="secundario" bloque onClick={() => setEstado(copiarLunesALaborables(estado))}>
          {t.copiarLunes}
        </Boton>

        <div aria-label={t.vista} role="group" className="rounded-[14px] bg-superficie-suave p-4">
          <p className="mb-1 text-sm font-semibold text-texto-suave">{t.vista}</p>
          {vista.length === 0 ? (
            <p>{t.sinHorarios}</p>
          ) : (
            <ul>
              {vista.map((l) => (
                <li key={l.dias}>
                  <span className="font-semibold">{l.dias}</span> {l.franjas}
                </li>
              ))}
            </ul>
          )}
        </div>

        {invalido ? (
          <p role="alert" className="text-sm font-medium text-peligro">
            {t.horaIgual}
          </p>
        ) : null}
        {error ? <Aviso variante="error">{error}</Aviso> : null}
        <p role="status" aria-live="polite" className="min-h-6 text-sm font-semibold text-exito">
          {resultado?.ok ? panelLocalEs.guardado : ""}
        </p>
        <Boton type="submit" bloque disabled={invalido} cargando={pendiente}>
          {t.guardar}
        </Boton>
      </form>
    </Tarjeta>
  );
}
