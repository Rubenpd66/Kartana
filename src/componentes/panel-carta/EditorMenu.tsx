"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { AreaTexto } from "@/componentes/ui/AreaTexto";
import { Aviso } from "@/componentes/ui/Aviso";
import { Boton } from "@/componentes/ui/Boton";
import { Campo } from "@/componentes/ui/Campo";
import { ConfirmarBorrado } from "@/componentes/ui/ConfirmarBorrado";
import { Insignia } from "@/componentes/ui/Insignia";
import { Interruptor } from "@/componentes/ui/Interruptor";
import { LIMITES, LIMITES_EXTRA } from "@/lib/dominio/limites";
import { cartaEs } from "@/lib/i18n/carta.es";
import { panelCartaEs, textoCampo } from "@/lib/i18n/panel-carta.es";
import type { EntradaMenu, Menu } from "@/lib/tipos/carta";
import type { DiaSemana } from "@/lib/tipos/dominio";
import type { Resultado } from "@/lib/tipos/resultado";
import { DIAS, estadoDesdeMenu, itemVacio, validarEstadoMenu, type EstadoMenu, type GrupoEditor, type ItemEditor } from "./menus";
import { SelectorAlergenos } from "./SelectorAlergenos";

const t = panelCartaEs.menu;

export type AccionesEditorMenu = {
  guardar: (entrada: EntradaMenu) => Promise<Resultado<{ menuId: string }>>;
  borrar: (localId: string, menuId: string) => Promise<Resultado>;
};

/** Clave nueva para React que no se repite con las del estado. */
function siguienteClave(e: EstadoMenu): number {
  return e.grupos.reduce((max, g) => Math.max(max, g.clave, ...g.items.map((i) => i.clave)), -1) + 1;
}

/** Mensaje de error de un campo del menú, con textos propios para precio, días y horas. */
function errorMenu(errores: Record<string, string>, campo: string): string | undefined {
  const codigo = errores[campo];
  if (!codigo) return undefined;
  if (campo === "precioCentimos") return codigo === "fuera_de_rango" ? panelCartaEs.campos.fuera_de_rango : t.errores.precio;
  if (campo === "dias") return t.errores.dias;
  if (campo === "horaInicio" || campo === "horaFin") return codigo === "fuera_de_rango" ? t.errores.horasOrden : t.errores.horas;
  return textoCampo(codigo);
}

/**
 * Editor de un menú del día: nombre, precio, días, horario, grupos con sus platos (y alérgenos) y notas.
 * Valida en el navegador con el mismo esquema que el servidor; si guarda bien, la acción vuelve a la lista.
 */
export function EditorMenu({ localId, menu, acciones }: { localId: string; menu: Menu | null; acciones: AccionesEditorMenu }) {
  const [estado, setEstado] = useState<EstadoMenu>(() => estadoDesdeMenu(menu));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const formulario = useRef<HTMLFormElement>(null);

  const cambiar = (cambios: Partial<EstadoMenu>) => setEstado((e) => ({ ...e, ...cambios }));
  const cambiarGrupo = (clave: number, cambios: (g: GrupoEditor) => Partial<GrupoEditor>) =>
    setEstado((e) => ({ ...e, grupos: e.grupos.map((g) => (g.clave === clave ? { ...g, ...cambios(g) } : g)) }));
  const cambiarItem = (grupo: number, item: number, cambios: Partial<ItemEditor>) =>
    cambiarGrupo(grupo, (g) => ({ items: g.items.map((i) => (i.clave === item ? { ...i, ...cambios } : i)) }));

  function alternarDia(dia: DiaSemana) {
    setEstado((e) => ({ ...e, dias: e.dias.includes(dia) ? e.dias.filter((d) => d !== dia) : DIAS.filter((d) => d === dia || e.dias.includes(d)) }));
  }

  function anadirGrupo() {
    setEstado((e) => {
      if (e.grupos.length >= LIMITES.gruposPorMenu) return e;
      const clave = siguienteClave(e);
      return { ...e, grupos: [...e.grupos, { clave, titulo: "", items: [itemVacio(clave + 1)] }] };
    });
  }

  function anadirItem(grupo: number) {
    setEstado((e) => {
      const clave = siguienteClave(e);
      return {
        ...e,
        grupos: e.grupos.map((g) => (g.clave === grupo && g.items.length < LIMITES.itemsPorGrupo ? { ...g, items: [...g.items, itemVacio(clave)] } : g)),
      };
    });
  }

  function enfocarPrimerError() {
    requestAnimationFrame(() => formulario.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const { entrada, errores: encontrados } = validarEstadoMenu(localId, menu?.id, estado);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setMensaje(panelCartaEs.comun.revisaCampos);
      enfocarPrimerError();
      return;
    }
    setMensaje(null);
    iniciar(async () => {
      const r = await acciones.guardar(entrada);
      if (!r.ok) {
        setErrores(r.campos ?? {});
        setMensaje(panelCartaEs.errores[r.error]);
        enfocarPrimerError();
      }
    });
  }

  async function borrar() {
    if (!menu) return;
    const r = await acciones.borrar(localId, menu.id);
    if (!r.ok) setMensaje(panelCartaEs.errores[r.error]);
  }

  return (
    <form ref={formulario} onSubmit={enviar} noValidate className="space-y-7 pb-28">
      <div className="space-y-4">
        <Campo
          etiqueta={t.nombre}
          name="nombre"
          value={estado.nombre}
          onChange={(e) => cambiar({ nombre: e.target.value })}
          maxLength={LIMITES_EXTRA.nombreMenu}
          required
          autoComplete="off"
          error={textoCampo(errores.nombre)}
        />
        <div className="max-w-56">
          <Campo
            etiqueta={t.precio}
            ayuda={t.precioAyuda}
            name="precio"
            inputMode="decimal"
            autoComplete="off"
            value={estado.precio}
            onChange={(e) => cambiar({ precio: e.target.value })}
            claseEntrada="text-right text-lg font-bold"
            error={errorMenu(errores, "precioCentimos")}
          />
        </div>
      </div>

      <fieldset>
        <legend className="font-semibold">{t.dias}</legend>
        <p className="mb-2 text-sm text-texto-suave">{t.diasAyuda}</p>
        <div className="flex flex-wrap gap-1.5">
          {DIAS.map((dia) => (
            <button
              key={dia}
              type="button"
              aria-pressed={estado.dias.includes(dia)}
              aria-label={cartaEs.dias[dia]}
              onClick={() => alternarDia(dia)}
              className="inline-flex size-12 items-center justify-center rounded-full border-2 border-borde bg-superficie font-bold text-texto aria-pressed:border-primario aria-pressed:bg-primario aria-pressed:text-sobre-primario"
            >
              <span aria-hidden="true">{cartaEs.diasCortos[dia]}</span>
            </button>
          ))}
        </div>
        {errores.dias ? (
          <p role="alert" className="mt-1.5 text-sm font-medium text-peligro">
            {errorMenu(errores, "dias")}
          </p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="mb-1 font-semibold">{t.horario}</legend>
        <div className="flex flex-wrap gap-x-6">
          <label className="flex min-h-12 cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="todoElDia"
              checked={estado.todoElDia}
              onChange={() => cambiar({ todoElDia: true })}
              className="size-5 cursor-pointer accent-primario"
            />
            {t.todoElDia}
          </label>
          <label className="flex min-h-12 cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="todoElDia"
              checked={!estado.todoElDia}
              onChange={() => cambiar({ todoElDia: false })}
              className="size-5 cursor-pointer accent-primario"
            />
            {t.deA}
          </label>
        </div>
        {!estado.todoElDia ? (
          <div className="mt-2 grid max-w-sm grid-cols-2 gap-3">
            <Campo
              etiqueta={t.desde}
              name="horaInicio"
              type="time"
              value={estado.horaInicio}
              onChange={(e) => cambiar({ horaInicio: e.target.value })}
              error={errorMenu(errores, "horaInicio")}
            />
            <Campo
              etiqueta={t.hasta}
              name="horaFin"
              type="time"
              value={estado.horaFin}
              onChange={(e) => cambiar({ horaFin: e.target.value })}
              error={errorMenu(errores, "horaFin")}
            />
          </div>
        ) : null}
      </fieldset>

      <section aria-labelledby="titulo-grupos" className="space-y-4">
        <h2 id="titulo-grupos" className="font-sans text-[1.0625rem] font-bold">
          {t.grupos}
        </h2>
        {estado.grupos.map((grupo, i) => {
          const tituloGrupo = grupo.titulo.trim() || t.tituloGrupo(i + 1);
          return (
            <div key={grupo.clave} className="space-y-3 rounded-[14px] border border-borde p-3">
              <div className="flex items-end gap-2">
                <Campo
                  className="min-w-0 flex-1"
                  etiqueta={t.tituloGrupo(i + 1)}
                  name={`grupo-${grupo.clave}`}
                  value={grupo.titulo}
                  onChange={(e) => cambiarGrupo(grupo.clave, () => ({ titulo: e.target.value }))}
                  maxLength={LIMITES_EXTRA.tituloGrupo}
                  autoComplete="off"
                  error={textoCampo(errores[`grupos.${i}.titulo`])}
                />
                <BotonQuitar
                  etiqueta={t.quitarGrupo(tituloGrupo)}
                  onClick={() => setEstado((e) => ({ ...e, grupos: e.grupos.filter((g) => g.clave !== grupo.clave) }))}
                />
              </div>
              <ul className="space-y-3">
                {grupo.items.map((item, j) => (
                  <ItemMenu
                    key={item.clave}
                    item={item}
                    etiqueta={t.nombreItem(tituloGrupo, j + 1)}
                    error={textoCampo(errores[`grupos.${i}.items.${j}.nombre`])}
                    onCambiar={(cambios) => cambiarItem(grupo.clave, item.clave, cambios)}
                    onQuitar={() => cambiarGrupo(grupo.clave, (g) => ({ items: g.items.filter((x) => x.clave !== item.clave) }))}
                  />
                ))}
              </ul>
              <button
                type="button"
                onClick={() => anadirItem(grupo.clave)}
                disabled={grupo.items.length >= LIMITES.itemsPorGrupo}
                className="flex min-h-12 w-full items-center justify-center rounded-[14px] border-2 border-dashed border-borde px-3 font-semibold text-primario hover:bg-superficie-suave disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.anadirItem(tituloGrupo)}
              </button>
            </div>
          );
        })}
        <Boton variante="secundario" onClick={anadirGrupo} disabled={estado.grupos.length >= LIMITES.gruposPorMenu}>
          {t.anadirGrupo}
        </Boton>
      </section>

      <AreaTexto
        etiqueta={
          <>
            {t.notas} <span className="font-normal text-texto-suave">{panelCartaEs.comun.opcional}</span>
          </>
        }
        ayuda={t.notasAyuda}
        name="notas"
        rows={2}
        value={estado.notas}
        onChange={(e) => cambiar({ notas: e.target.value })}
        maxLength={LIMITES_EXTRA.notasMenu}
        error={textoCampo(errores.notas)}
      />

      <Interruptor etiqueta={t.visible} activado={estado.visible} onCambiar={(visible) => cambiar({ visible })} />

      {menu ? <ConfirmarBorrado etiquetaBoton={t.borrar} titulo={t.borrarTitulo(menu.nombre)} descripcion={t.borrarTexto} onConfirmar={borrar} /> : null}

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

function BotonQuitar({ etiqueta, onClick }: { etiqueta: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-borde bg-superficie text-xl text-peligro hover:bg-superficie-suave"
    >
      <span aria-hidden="true">×</span>
    </button>
  );
}

function ItemMenu({
  item,
  etiqueta,
  error,
  onCambiar,
  onQuitar,
}: {
  item: ItemEditor;
  etiqueta: string;
  error?: string;
  onCambiar: (cambios: Partial<ItemEditor>) => void;
  onQuitar: () => void;
}) {
  const nombre = item.nombre.trim() || etiqueta;
  return (
    <li className="space-y-2 border-t border-borde pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-end gap-2">
        <Campo
          className="min-w-0 flex-1"
          etiqueta={etiqueta}
          name={`item-${item.clave}`}
          value={item.nombre}
          onChange={(e) => onCambiar({ nombre: e.target.value })}
          maxLength={LIMITES_EXTRA.nombreItem}
          autoComplete="off"
          error={error}
        />
        <BotonQuitar etiqueta={t.quitarItem(nombre)} onClick={onQuitar} />
      </div>
      <details className="rounded-[14px] bg-superficie-suave">
        <summary className="flex min-h-12 cursor-pointer flex-wrap items-center gap-2 px-3 font-semibold">
          {t.alergenosDe(nombre)}
          {!item.alergenosConfirmados ? <Insignia variante="aviso">{t.sinRevisar}</Insignia> : null}
        </summary>
        <div className="space-y-2 px-2 pb-3">
          <SelectorAlergenos
            etiqueta={t.alergenosDe(nombre)}
            valor={item.alergenos}
            onCambiar={(alergenos) => onCambiar({ alergenos })}
            tamano="compacto"
          />
          <label className="flex min-h-12 cursor-pointer items-center gap-3 px-1 font-semibold">
            <input
              type="checkbox"
              checked={item.alergenosConfirmados}
              onChange={(e) => onCambiar({ alergenosConfirmados: e.target.checked })}
              className="size-6 shrink-0 cursor-pointer accent-exito"
            />
            {t.confirmarItem}
          </label>
        </div>
      </details>
    </li>
  );
}
