import Link from "next/link";
import type { ReactNode } from "react";

/** Título de una pantalla del editor con el enlace «←» para volver (48 px). `volver` null mientras carga. */
export function CabeceraEditor({ titulo, volver }: { titulo: ReactNode; volver: { href: string; texto: string } | null }) {
  return (
    <div className="flex min-h-14 items-center gap-2">
      {volver ? (
        <Link
          href={volver.href}
          aria-label={volver.texto}
          className="-ml-3 inline-flex size-12 shrink-0 items-center justify-center rounded-full text-xl text-texto no-underline hover:bg-superficie-suave"
        >
          <span aria-hidden="true">←</span>
        </Link>
      ) : (
        <span aria-hidden="true" className="-ml-3 size-12 shrink-0" />
      )}
      <h1 className="text-[1.625rem]">{titulo}</h1>
    </div>
  );
}
