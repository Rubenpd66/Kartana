import type { Metadata } from "next";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { BotonTraducir } from "@/componentes/panel-idiomas/BotonTraducir";
import { EstadoIdioma } from "@/componentes/panel-idiomas/EstadoIdioma";
import { SelectorIdiomas } from "@/componentes/panel-idiomas/SelectorIdiomas";
import { Aviso } from "@/componentes/ui/Aviso";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { leerInterruptores } from "@/lib/config/interruptores";
import { listarTextosTraducibles } from "@/lib/datos/traducciones";
import { panelIdiomasEs } from "@/lib/i18n/panel-idiomas.es";
import { obtenerLocalActual } from "@/lib/panel/local-actual";
import type { IdiomaDestino } from "@/lib/tipos/dominio";
import { resumirTraducciones, soloDestino } from "@/lib/traduccion/estado";
import { guardarIdiomasAccion, traducirAhoraAccion } from "./acciones";
import { obtenerLocalDelDueno } from "@/lib/datos/panel";

const t = panelIdiomasEs.idiomas;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function PaginaIdiomas({ params }: PageProps<"/panel/[local]/idiomas">) {
  return (
    <Contenedor ancho="estrecho" className="space-y-5 py-6">
      <div>
        <h1 className="text-[1.75rem]">{t.titulo}</h1>
        <p className="mt-1 text-texto-suave">{t.intro}</p>
      </div>
      <Suspense fallback={<Esqueleto lineas={6} alto="h-12" />}>
        <Contenido params={params} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({ params }: Pick<PageProps<"/panel/[local]/idiomas">, "params">) {
  const { local: id } = await params;
  // Comprueba la sesión y que el local es del usuario (o notFound).
  const resumenLocal = await obtenerLocalActual(id);
  const local = await obtenerLocalDelDueno(resumenLocal.id);
  if (!local) {
    return <Aviso variante="error">{panelIdiomasEs.errores.error_servidor}</Aviso>;
  }
  const destinos = soloDestino(local.idiomasActivos as IdiomaDestino[]);
  const textos = destinos.length > 0 ? await listarTextosTraducibles(local.id) : [];
  const resumenes = resumirTraducciones(textos, destinos);
  const servicioApagado = !leerInterruptores().traduccion;

  return (
    <>
      <SelectorIdiomas key={local.idiomasActivos.join(",")} activos={local.idiomasActivos} guardar={guardarIdiomasAccion.bind(null, local.id)} />

      {destinos.length === 0 ? (
        <Aviso variante="info" sinRol>
          {t.sinIdiomas}
        </Aviso>
      ) : (
        <ul className="space-y-3" aria-label={t.titulo}>
          {resumenes.map((r) => (
            <EstadoIdioma key={r.idioma} resumen={r} localId={local.id} slug={local.slug} publicado={local.publicado} />
          ))}
        </ul>
      )}

      <BotonTraducir
        traducir={traducirAhoraAccion.bind(null, local.id)}
        servicioApagado={servicioApagado}
        hayIdiomas={destinos.length > 0}
      />

      <Aviso variante="aviso" sinRol>
        {t.recordatorio}
      </Aviso>
    </>
  );
}
