import { crearMatriz, MARGEN_MODULOS, trazadoQr } from "@/lib/qr/matriz";

/**
 * QR de la carta como SVG en vectores, siempre negro sobre blanco (con zona tranquila).
 * Se dibuja con elementos de React, sin HTML en bruto. Ancho por `className`.
 */
export function QrPantalla({ url, etiqueta, className = "" }: { url: string; etiqueta: string; className?: string }) {
  const matriz = crearMatriz(url);
  const lado = matriz.tamano + MARGEN_MODULOS * 2;
  return (
    <svg
      viewBox={`0 0 ${lado} ${lado}`}
      role="img"
      aria-label={etiqueta}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={lado} height={lado} fill="#ffffff" />
      <path d={trazadoQr(matriz, MARGEN_MODULOS)} fill="#000000" />
    </svg>
  );
}

/** Dibujo simple del formato (no es el PDF): mesa, pegatinas o póster. */
export function MiniaturaFormato({ formato }: { formato: "mesa" | "pegatinas" | "poster" }) {
  const celdas = formato === "mesa" ? 4 : formato === "pegatinas" ? 6 : 1;
  const rejilla = formato === "mesa" ? "grid-cols-2 grid-rows-2 gap-0.5 p-1" : formato === "pegatinas" ? "grid-cols-2 grid-rows-3 gap-1 p-1.5" : "";
  const tamanoQr = formato === "mesa" ? "size-[18px]" : formato === "pegatinas" ? "size-3.5" : "size-12 mt-3.5";
  return (
    <div
      aria-hidden="true"
      className={`relative grid h-28 w-22 shrink-0 place-items-center overflow-hidden rounded-lg border border-borde bg-superficie ${rejilla}`}
    >
      {formato === "poster" ? <span className="absolute inset-x-0 top-0 h-5 bg-primario" /> : null}
      {Array.from({ length: celdas }, (_, i) => (
        <span
          key={i}
          className={`grid place-items-center ${formato === "mesa" ? "border border-dashed border-borde" : ""} ${formato === "pegatinas" ? "rounded border border-borde" : ""}`}
        >
          <span className={`${tamanoQr} border-2 border-texto bg-[conic-gradient(var(--color-texto)_25%,#fff_0_50%,var(--color-texto)_0_75%,#fff_0)] bg-[length:6px_6px]`} />
        </span>
      ))}
    </div>
  );
}
