import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Contenedor } from "@/componentes/Contenedor";
import { destinoDelPanel } from "@/componentes/panel-local/destino";
import { Esqueleto } from "@/componentes/ui/Esqueleto";
import { Insignia } from "@/componentes/ui/Insignia";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { clasesBoton } from "@/componentes/ui/Boton";
import { condicionesAlDia } from "@/lib/auth/aceptaciones";
import { exigirUsuario } from "@/lib/auth/sesion";
import { listarMisLocales } from "@/lib/datos/panel";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";

const t = panelLocalEs.elegir;

export const metadata: Metadata = { title: t.metaTitulo, robots: { index: false, follow: false } };

export default function PaginaPanel() {
  return (
    <Suspense
      fallback={
        <Contenedor ancho="estrecho" className="py-6">
          <Esqueleto lineas={3} alto="h-8" />
        </Contenedor>
      }
    >
      <Destino />
    </Suspense>
  );
}

async function Destino() {
  await exigirUsuario("/panel");
  const [alDia, locales] = await Promise.all([condicionesAlDia(), listarMisLocales()]);
  const destino = destinoDelPanel(
    alDia,
    locales.map((l) => l.id),
  );
  if (destino.tipo === "ir") redirect(destino.ruta);

  return (
    <Contenedor ancho="estrecho" className="space-y-4 py-6">
      <h1 className="text-[1.75rem]">{t.titulo}</h1>
      <ul className="space-y-3">
        {locales.map((l) => (
          <li key={l.id}>
            <Tarjeta como="div" className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{l.nombre}</p>
                <Insignia variante={l.publicado ? "exito" : "neutra"}>{l.publicado ? t.publicada : t.borrador}</Insignia>
              </div>
              <Link href={`/panel/${l.id}`} className={clasesBoton()}>
                {t.abrir}
                <span className="sr-only"> {l.nombre}</span>
              </Link>
            </Tarjeta>
          </li>
        ))}
      </ul>
    </Contenedor>
  );
}
