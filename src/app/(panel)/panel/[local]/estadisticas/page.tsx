import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { GraficoVisitas } from "@/componentes/estadisticas/GraficoVisitas";
import { ResumenIdiomas } from "@/componentes/estadisticas/ResumenIdiomas";
import { SelectorRango, leerRango } from "@/componentes/estadisticas/SelectorRango";
import { TablaPlatos } from "@/componentes/estadisticas/TablaPlatos";
import { Aviso } from "@/componentes/ui/Aviso";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { exigirUsuario } from "@/lib/auth/sesion";
import { obtenerResumenEstadisticas } from "@/lib/datos/estadisticas";
import { obtenerLocalDelDueno } from "@/lib/datos/panel";
import { estadisticasEs as t } from "@/lib/i18n/estadisticas.es";
import type { ResumenEstadisticas } from "@/lib/tipos/estadisticas";

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function PaginaEstadisticas(props: PageProps<"/panel/[local]/estadisticas">) {
  return (
    <Contenedor ancho="estrecho" className="space-y-5 py-6">
      <header>
        <h1 className="text-[1.75rem]">{t.titulo}</h1>
        <p className="text-texto-suave">{t.intro}</p>
      </header>
      <Suspense fallback={<Esqueleto lineas={6} alto="h-8" />}>
        <Contenido {...props} />
      </Suspense>
    </Contenedor>
  );
}

function Cifra({ valor, etiqueta, nota }: { valor: number | string; etiqueta: string; nota?: string }) {
  return (
    <Tarjeta como="div" className="text-center">
      <p className="font-titulo text-[2rem] leading-none font-bold tabular-nums">{valor}</p>
      <p className="mt-1 text-sm text-texto-suave">{etiqueta}</p>
      {nota ? <p className="mt-1 text-xs text-texto-suave">{nota}</p> : null}
    </Tarjeta>
  );
}

async function Contenido({ params, searchParams }: PageProps<"/panel/[local]/estadisticas">) {
  const { local: localId } = await params;
  const { dias: diasParam } = await searchParams;
  const dias = leerRango(diasParam);
  const base = `/panel/${localId}/estadisticas`;
  await exigirUsuario(base);
  const local = await obtenerLocalDelDueno(localId);
  if (!local) notFound();

  let resumen: ResumenEstadisticas | null = null;
  try {
    resumen = await obtenerResumenEstadisticas(local.id, dias);
  } catch {
    resumen = null;
  }

  return (
    <>
      <SelectorRango base={base} actual={dias} />
      {resumen === null ? (
        <Aviso variante="error">{t.error}</Aviso>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Cifra valor={resumen.totalVisitas} etiqueta={t.cifras.visitas} />
            <Cifra valor={resumen.platosMasVistos.reduce((s, p) => s + p.vistas, 0)} etiqueta={t.cifras.platos} />
            <div className="col-span-2">
              <Cifra
                valor={resumen.totalClicsResena > 0 ? resumen.totalClicsResena : "—"}
                etiqueta={t.cifras.resenas}
                nota={resumen.totalClicsResena > 0 ? undefined : t.cifras.resenasProxima}
              />
            </div>
          </div>

          <Tarjeta aria-labelledby="t-visitas">
            <h2 id="t-visitas" className="mb-3 font-sans text-[1.0625rem] font-bold">
              {t.grafico.titulo}
            </h2>
            <GraficoVisitas dias={resumen.dias.map((d) => ({ dia: d.dia, visitas: d.visitas }))} />
          </Tarjeta>

          <Tarjeta aria-labelledby="t-idiomas">
            <h2 id="t-idiomas" className="mb-3 font-sans text-[1.0625rem] font-bold">
              {t.idiomas.titulo}
            </h2>
            <ResumenIdiomas dias={resumen.dias} />
          </Tarjeta>

          <Tarjeta aria-labelledby="t-platos">
            <h2 id="t-platos" className="font-sans text-[1.0625rem] font-bold">
              {t.platos.titulo}
            </h2>
            <p className="mb-2 text-sm text-texto-suave">{t.platos.intro}</p>
            <TablaPlatos platos={resumen.platosMasVistos} />
          </Tarjeta>
        </>
      )}
      <p className="text-center text-sm text-texto-suave">{t.confianza}</p>
    </>
  );
}
