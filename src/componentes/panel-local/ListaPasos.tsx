import Link from "next/link";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { ClavePaso } from "./pasos";

const t = panelLocalEs.inicio.pasos;

const DESTINO: Record<ClavePaso, (id: string) => string> = {
  seccionYPlato: (id) => `/panel/${id}/carta`,
  alergenos: (id) => `/panel/${id}/carta`,
  logo: (id) => `/panel/${id}/local`,
  color: (id) => `/panel/${id}/local`,
  publicar: (id) => `/panel/${id}#publicar`,
  qr: (id) => `/panel/${id}/qr`,
};

/** Lista de pasos para dejar la carta lista; cada uno lleva a donde se hace. */
export function ListaPasos({ localId, pasos }: { localId: string; pasos: Array<{ clave: ClavePaso; hecho: boolean }> }) {
  return (
    <ol className="divide-y divide-borde">
      {pasos.map((p) => (
        <li key={p.clave}>
          <Link href={DESTINO[p.clave](localId)} className="flex min-h-12 items-center gap-3 py-2 text-texto no-underline">
            <span
              aria-hidden="true"
              className={`grid size-7 shrink-0 place-items-center rounded-full border text-sm font-bold ${p.hecho ? "border-exito bg-exito text-sobre-primario" : "border-borde text-transparent"}`}
            >
              ✓
            </span>
            <span className={p.hecho ? "text-texto-suave line-through" : "font-semibold"}>{t[p.clave]}</span>
            <span className="sr-only">: {p.hecho ? t.hecho : t.pendiente}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
