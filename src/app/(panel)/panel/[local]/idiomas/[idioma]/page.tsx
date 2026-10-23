import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { agruparTextos, tipoDeCampo } from "@/componentes/panel-idiomas/agrupar";
import { BotonMantenerOriginal } from "@/componentes/panel-idiomas/BotonMantenerOriginal";
import { CampoTraduccion } from "@/componentes/panel-idiomas/CampoTraduccion";
import { Aviso } from "@/componentes/ui/Aviso";
import { clasesBoton } from "@/componentes/ui/Boton";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { obtenerLocalDelDueno } from "@/lib/datos/panel";
import { listarTextosTraducibles } from "@/lib/datos/traducciones";
import { esIdiomaCarta, NOMBRE_IDIOMA } from "@/lib/i18n/idiomas";
import { panelIdiomasEs } from "@/lib/i18n/panel-idiomas.es";
import { obtenerLocalActual } from "@/lib/panel/local-actual";
import type { IdiomaDestino } from "@/lib/tipos/dominio";
import { descartarTraduccionAccion, guardarTraduccionAccion, mantenerOriginalAccion } from "../acciones";

const t = panelIdiomasEs.textos;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function PaginaTextos({ params, searchParams }: PageProps<"/panel/[local]/idiomas/[idioma]">) {
  return (
    <Contenedor ancho="estrecho" className="space-y-5 py-6">
      <Suspense fallback={<Esqueleto lineas={6} alto="h-16" />}>
        <Contenido params={params} searchParams={searchParams} />
      </Suspense>
    </Contenedor>
  );
}

async function Contenido({
  params,
  searchParams,
}: Pick<PageProps<"/panel/[local]/idiomas/[idioma]">, "params" | "searchParams">) {
  const { local: id, idioma } = await params;
  if (!esIdiomaCarta(idioma) || idioma === "es") notFound();
  const resumenLocal = await obtenerLocalActual(id);
  const local = await obtenerLocalDelDueno(resumenLocal.id);
  if (!local || !local.idiomasActivos.includes(idioma)) notFound();

  const destino: IdiomaDestino = idioma;
  const nombreIdioma = NOMBRE_IDIOMA[destino];
  const { pendientes } = await searchParams;
  const soloPendientes = pendientes === "1";
  const base = `/panel/${local.id}/idiomas`;

  let textos;
  try {
    textos = await listarTextosTraducibles(local.id);
  } catch (error) {
    console.error("panel-idiomas:", error);
    return <Aviso variante="error">{t.cargaFallida}</Aviso>;
  }
  const grupos = agruparTextos(textos, destino, soloPendientes);
  const hayTextos = agruparTextos(textos, destino).length > 0;

  return (
    <>
      <div>
        <Link href={base} className="inline-flex min-h-12 items-center font-semibold">
          ← {t.volver}
        </Link>
        <h1 className="text-[1.75rem]">{t.titulo(nombreIdioma)}</h1>
        <p className="mt-1 text-texto-suave">{t.intro}</p>
      </div>

      <Link
        href={soloPendientes ? `${base}/${destino}` : `${base}/${destino}?pendientes=1`}
        aria-current={soloPendientes ? "true" : undefined}
        className={clasesBoton({ variante: soloPendientes ? "primario" : "secundario" })}
      >
        {t.filtro}
      </Link>

      {grupos.length === 0 ? (
        <Aviso variante="info" sinRol>
          {hayTextos ? t.vacioFiltro : t.vacio}
        </Aviso>
      ) : (
        grupos.map((g) => (
          <Tarjeta key={g.clave} aria-label={`${t.grupos[g.tabla]}${g.titulo ? `: ${g.titulo}` : ""}`} className="space-y-3">
            <h2 className="text-lg">
              <span className="text-sm font-semibold text-texto-suave">{t.grupos[g.tabla]}</span>
              {g.titulo ? <span className="block">{g.titulo}</span> : null}
            </h2>
            {g.campos.map(({ texto, estado }) => {
              const tipo = tipoDeCampo(texto.campo);
              const detalle = tipo === "nombre" || tipo === "descripcion" || tipo === "notas" ? "" : ` «${texto.original}»`;
              return (
                <CampoTraduccion
                  key={texto.campo}
                  localId={local.id}
                  tabla={texto.tabla}
                  filaId={texto.filaId}
                  campo={texto.campo}
                  idioma={destino}
                  rotulo={`${t.traduccionDe(t.campos[tipo], nombreIdioma)}${detalle}`}
                  original={texto.original}
                  traduccion={texto.traducciones[destino]?.texto ?? ""}
                  estado={estado}
                  guardar={guardarTraduccionAccion}
                  descartar={descartarTraduccionAccion}
                />
              );
            })}
            {g.tabla !== "locales" && g.titulo ? (
              <BotonMantenerOriginal localId={local.id} tabla={g.tabla} filaId={g.filaId} mantener={mantenerOriginalAccion} />
            ) : null}
          </Tarjeta>
        ))
      )}
    </>
  );
}
