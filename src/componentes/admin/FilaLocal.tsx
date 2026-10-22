import Link from "next/link";
import { Insignia, type VarianteInsignia } from "@/componentes/ui/Insignia";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { adminEs as t } from "@/lib/i18n/admin.es";
import { rutaCarta } from "@/lib/i18n/idiomas";
import type { EstadoAcceso, FilaAdmin } from "@/lib/tipos/cuentas";
import { AccionesLocal } from "./BotonPiloto";
import { estadoVisible, fechaCorta, textoVencimiento } from "./formato";

const VARIANTE: Record<EstadoAcceso, VarianteInsignia> = {
  prueba: "aviso",
  piloto: "exito",
  suscripcion: "exito",
  cortesia: "neutra",
  vencido: "peligro",
};

/** Un local: tarjeta con datos, estado (texto + color) y acciones. */
export function FilaLocal({ fila }: { fila: FilaAdmin }) {
  const estado = estadoVisible(fila.acceso);
  const ruta = rutaCarta(fila.slug);
  const sePuedeVer = fila.publicado && fila.acceso.activo;
  return (
    <Tarjeta como="article" aria-label={fila.nombre}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-sans text-lg font-bold">{fila.nombre}</h2>
        <Insignia variante={VARIANTE[estado]}>{textoVencimiento(fila.acceso)}</Insignia>
      </div>
      <dl className="my-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[0.9375rem]">
        <dt className="text-texto-suave">{t.fila.dueno}</dt>
        <dd className="break-all">{fila.correoDueno || t.fila.sinDueno}</dd>
        <dt className="text-texto-suave">{t.fila.carta}</dt>
        <dd>
          {sePuedeVer ? (
            <Link href={ruta} className="underline">
              {ruta}
            </Link>
          ) : (
            <span>{ruta}</span>
          )}{" "}
          · {!fila.publicado ? t.fila.sinPublicar : !fila.acceso.activo ? t.fila.noSeVe : t.fila.publicada} ·{" "}
          {t.fila.platos(fila.numPlatos)}
        </dd>
        <dt className="text-texto-suave">{t.fila.alta}</dt>
        <dd>{fechaCorta(fila.creadoEn)}</dd>
      </dl>
      <AccionesLocal localId={fila.localId} nombre={fila.nombre} estado={estado} />
    </Tarjeta>
  );
}
