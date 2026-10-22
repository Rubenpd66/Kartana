import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { Boton } from "@/componentes/ui/Boton";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { ultimasAceptaciones } from "@/lib/auth/aceptaciones";
import { exigirUsuario } from "@/lib/auth/sesion";
import { panelEs } from "@/lib/i18n/panel.es";
import { TITULAR } from "@/lib/legal/titular";
import type { AceptacionLegal } from "@/lib/tipos/cuentas";

const t = panelEs.cuenta;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function Cuenta() {
  return (
    <Contenedor ancho="estrecho" className="space-y-5 py-6">
      <h1 className="text-[1.75rem]">{t.titulo}</h1>
      <Suspense fallback={<Esqueleto lineas={6} alto="h-6" />}>
        <DatosCuenta />
      </Suspense>
      <Tarjeta aria-labelledby="titulo-baja">
        <h2 id="titulo-baja" className="text-xl">
          {t.bajaTitulo}
        </h2>
        <p className="mt-2 text-texto-suave">
          {t.baja}{" "}
          <a href={`mailto:${TITULAR.correo}`} className="break-all font-semibold text-texto underline">
            {TITULAR.correo}
          </a>
          . {t.bajaDetalle}
        </p>
      </Tarjeta>
    </Contenedor>
  );
}

const formatoFecha = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });

function LineaAceptacion({ nombre, ruta, aceptacion }: { nombre: string; ruta: string; aceptacion: AceptacionLegal | null }) {
  return (
    <div className="border-t border-borde py-3 first:border-t-0">
      <p className="font-semibold">{nombre}</p>
      <p className="text-sm text-texto-suave">
        {aceptacion ? t.aceptada(aceptacion.version, formatoFecha.format(new Date(aceptacion.aceptadaEn))) : t.sinAceptar}{" "}
        <Link href={ruta} className="font-semibold text-texto underline">
          {t.leer}
          <span className="sr-only"> {nombre}</span>
        </Link>
      </p>
    </div>
  );
}

async function DatosCuenta() {
  const usuario = await exigirUsuario("/panel/cuenta");
  const aceptaciones = await ultimasAceptaciones();
  return (
    <>
      <Tarjeta aria-label={t.correo}>
        <p className="text-sm text-texto-suave">{t.correo}</p>
        <p className="break-all text-lg font-semibold">{usuario.correo}</p>
      </Tarjeta>
      <Tarjeta>
        <LineaAceptacion nombre={t.condiciones} ruta="/legal/condiciones" aceptacion={aceptaciones.condiciones} />
        <LineaAceptacion nombre={t.privacidad} ruta="/legal/privacidad" aceptacion={aceptaciones.privacidad} />
      </Tarjeta>
      <form action="/auth/salir" method="post">
        <Boton type="submit" variante="secundario" bloque>
          {t.salir}
        </Boton>
      </form>
    </>
  );
}
