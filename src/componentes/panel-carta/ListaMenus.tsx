"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Insignia } from "@/componentes/ui/Insignia";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { LIMITES } from "@/lib/dominio/limites";
import { formatearPrecio } from "@/lib/dominio/precios";
import { cartaEs } from "@/lib/i18n/carta.es";
import { panelCartaEs } from "@/lib/i18n/panel-carta.es";
import type { Menu } from "@/lib/tipos/carta";
import type { Resultado } from "@/lib/tipos/resultado";
import { FlechasOrden } from "./FlechasOrden";
import { resumirHorarioMenu } from "./menus";
import { mover } from "./orden";

const t = panelCartaEs.menus;

/** Lista de menús del día con flechas para ordenarlos (se guarda al momento). */
export function ListaMenus({
  localId,
  menus,
  ordenar,
  guardado = null,
  borrado = false,
}: {
  localId: string;
  menus: Menu[];
  ordenar: (localId: string, ids: string[]) => Promise<Resultado>;
  guardado?: string | null;
  borrado?: boolean;
}) {
  const [vistos, cambiarOrden] = useOptimistic(menus, (actual: Menu[], ids: string[]) =>
    ids.map((id) => actual.find((m) => m.id === id)).filter((m): m is Menu => Boolean(m)),
  );
  const [errorOrden, setErrorOrden] = useState(false);
  const [, iniciar] = useTransition();
  const menuGuardado = guardado ? vistos.find((m) => m.id === guardado) : undefined;
  const lleno = vistos.length >= LIMITES.menusPorLocal;

  useEffect(() => {
    if (guardado) document.getElementById(`menu-${guardado}`)?.scrollIntoView({ block: "center" });
  }, [guardado]);

  function moverMenu(i: number, delta: -1 | 1) {
    const ids = mover(vistos, i, delta).map((m) => m.id);
    setErrorOrden(false);
    iniciar(async () => {
      cambiarOrden(ids);
      const r = await ordenar(localId, ids);
      if (!r.ok) setErrorOrden(true);
    });
  }

  const nuevo = (
    <Link href={`/panel/${localId}/menu/nuevo`} className={clasesBoton({ variante: vistos.length === 0 ? "primario" : "secundario" })}>
      {vistos.length === 0 ? t.vacioBoton : t.nuevo}
    </Link>
  );

  return (
    <div className="mt-3 space-y-4">
      <p className="text-texto-suave">{t.intro}</p>
      {menuGuardado ? <Aviso variante="exito">{t.guardado(menuGuardado.nombre)}</Aviso> : null}
      {borrado ? <Aviso variante="exito">{t.borrado}</Aviso> : null}
      {errorOrden ? <Aviso variante="error">{panelCartaEs.lista.errorOrden}</Aviso> : null}

      {vistos.length === 0 ? (
        <Tarjeta relleno="grande" className="text-center" aria-labelledby="titulo-sin-menus">
          <h2 id="titulo-sin-menus" className="text-xl">
            {t.vacioTitulo}
          </h2>
          <p className="mt-2 mb-4 text-texto-suave">{t.vacioTexto}</p>
          {nuevo}
        </Tarjeta>
      ) : (
        <>
          <ul className="divide-y divide-borde rounded-[14px] border border-borde bg-superficie">
            {vistos.map((menu, i) => (
              <li id={`menu-${menu.id}`} key={menu.id} className={`flex scroll-mt-24 items-center gap-3 p-3 ${menu.id === guardado ? "bg-exito/10" : ""}`}>
                <Link href={`/panel/${localId}/menu/${menu.id}`} className="block min-h-12 min-w-0 flex-1 text-texto no-underline">
                  <span className="flex flex-wrap items-center gap-x-2 font-semibold">
                    <span className="sr-only">{panelCartaEs.lista.editar} </span>
                    {menu.nombre}
                    {!menu.visible ? <Insignia>{t.oculto}</Insignia> : null}
                  </span>
                  <span className="block text-[0.9375rem] text-texto-suave">
                    {menu.precioCentimos === null ? t.sinPrecio : formatearPrecio(menu.precioCentimos, cartaEs.locale)} ·{" "}
                    {resumirHorarioMenu(menu, cartaEs)}
                  </span>
                </Link>
                {vistos.length > 1 ? (
                  <FlechasOrden nombre={menu.nombre} esPrimero={i === 0} esUltimo={i === vistos.length - 1} onMover={(d) => moverMenu(i, d)} />
                ) : null}
              </li>
            ))}
          </ul>
          {lleno ? <p className="text-sm text-texto-suave">{t.limite(LIMITES.menusPorLocal)}</p> : nuevo}
        </>
      )}
    </div>
  );
}
