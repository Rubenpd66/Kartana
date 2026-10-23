import { Contenedor } from "@/componentes/Contenedor";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

export type EntradaNav = { ancla: string; nombre: string };

/** Fila de chips con anclas a cada sección (desplazamiento horizontal, sin JavaScript). */
export function NavSecciones({ entradas, diccionario }: { entradas: EntradaNav[]; diccionario: DiccionarioCarta }) {
  if (entradas.length < 2) return null;
  return (
    <nav className="carta-nav" aria-label={diccionario.textos.secciones}>
      <Contenedor ancho="estrecho">
        <ul className="chips py-2.5">
          {entradas.map((e) => (
            <li key={e.ancla} className="flex-none">
              <a
                href={`#${e.ancla}`}
                className="chip inline-flex min-h-12 items-center rounded-full border border-borde bg-superficie px-4 text-[0.9375rem] font-medium whitespace-nowrap"
              >
                {e.nombre}
              </a>
            </li>
          ))}
        </ul>
      </Contenedor>
    </nav>
  );
}
