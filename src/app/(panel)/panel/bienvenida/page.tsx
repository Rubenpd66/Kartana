import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { FormularioCrearLocal } from "@/componentes/panel-local/FormularioCrearLocal";
import { PasoCondiciones } from "@/componentes/panel-local/PasoCondiciones";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { condicionesAlDia } from "@/lib/auth/aceptaciones";
import { exigirUsuario } from "@/lib/auth/sesion";
import { urlSitio } from "@/lib/config/sitio";
import { listarMisLocales } from "@/lib/datos/panel";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import { aceptarCondiciones, comprobarDireccion, crearMiLocal } from "./acciones";

const t = panelLocalEs.bienvenida;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function Bienvenida() {
  return (
    <Contenedor ancho="estrecho" className="space-y-5 py-6">
      <h1 className="text-[1.75rem]">{t.titulo}</h1>
      <Suspense fallback={<Esqueleto lineas={4} alto="h-8" />}>
        <Pasos />
      </Suspense>
    </Contenedor>
  );
}

async function Pasos() {
  await exigirUsuario("/panel/bienvenida");
  const [alDia, locales] = await Promise.all([condicionesAlDia(), listarMisLocales()]);
  // Si ya tiene local (v0.1: uno por persona) no hay nada que crear.
  if (alDia && locales.length > 0) redirect(`/panel/${locales[0].id}`);

  return alDia ? (
    <Tarjeta aria-labelledby="paso-2" relleno="grande">
      <h2 id="paso-2" className="mb-4 text-xl">
        {t.paso2Titulo}
      </h2>
      <FormularioCrearLocal crear={crearMiLocal} comprobar={comprobarDireccion} urlBase={urlSitio()} />
    </Tarjeta>
  ) : (
    <Tarjeta aria-labelledby="paso-1" relleno="grande">
      <h2 id="paso-1" className="mb-2 text-xl">
        {t.paso1Titulo}
      </h2>
      <PasoCondiciones aceptar={aceptarCondiciones} />
    </Tarjeta>
  );
}
