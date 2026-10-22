import { Aviso } from "@/componentes/ui/Aviso";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { AccesoEfectivo } from "@/lib/tipos/cuentas";

const t = panelLocalEs.inicio.acceso;

/** Texto corto del acceso: prueba con días, piloto, cortesía, suscripción o caducado. */
export function textoAcceso(acceso: AccesoEfectivo): string {
  if (!acceso.activo) return t.caducado;
  const dias = acceso.diasRestantes ?? 0;
  switch (acceso.estado) {
    case "prueba":
      return t.prueba(dias);
    case "piloto":
      return t.piloto(dias);
    case "suscripcion":
      return t.suscripcion;
    default:
      return t.cortesia;
  }
}

/** Estado del acceso del local. Si ha caducado avisa de que la carta no se ve y da el correo del titular. */
export function BloqueAcceso({ acceso, correoTitular }: { acceso: AccesoEfectivo; correoTitular: string }) {
  if (!acceso.activo) {
    return (
      <Aviso variante="error" titulo={t.caducado}>
        {t.caducadoAviso}{" "}
        <a href={`mailto:${correoTitular}`} className="break-all font-semibold underline">
          {correoTitular}
        </a>
      </Aviso>
    );
  }
  return (
    <Tarjeta como="div" aria-label={textoAcceso(acceso)}>
      <p className="font-semibold">{textoAcceso(acceso)}</p>
    </Tarjeta>
  );
}
