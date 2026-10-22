import { uiEs as t } from "@/lib/i18n/ui.es";

/**
 * Hueco gris que late mientras carga algo (para los `fallback` de `<Suspense>`).
 * - `lineas`: número de barras (por defecto 1). `alto`: clase de altura de cada barra (por defecto `h-5`).
 * - Lleva un texto oculto «Cargando…» para lectores de pantalla (`etiqueta` lo cambia; `null` lo quita).
 * La animación se para con «reducir movimiento» (globals.css).
 */
export function Esqueleto({
  lineas = 1,
  alto = "h-5",
  etiqueta = t.cargando,
  className = "",
}: {
  lineas?: number;
  alto?: string;
  etiqueta?: string | null;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} role={etiqueta ? "status" : undefined}>
      {Array.from({ length: lineas }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`${alto} animate-pulse rounded-lg bg-superficie-suave ${i === lineas - 1 && lineas > 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
      {etiqueta ? <span className="sr-only">{etiqueta}</span> : null}
    </div>
  );
}
