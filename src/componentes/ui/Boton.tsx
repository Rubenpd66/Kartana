import type { PropsBoton } from "@/lib/tipos/contratos";
import { uiEs as t } from "@/lib/i18n/ui.es";

type Variante = NonNullable<PropsBoton["variante"]>;
type Tamano = NonNullable<PropsBoton["tamano"]>;

const VARIANTES: Record<Variante, string> = {
  primario: "bg-primario text-sobre-primario hover:bg-primario-hover",
  secundario: "border-borde bg-superficie text-texto hover:bg-superficie-suave",
  peligro: "border-current bg-superficie text-peligro hover:bg-superficie-suave",
  fantasma: "bg-transparent text-texto hover:bg-superficie-suave",
};

/**
 * Clases de botón para usarlas también en enlaces (`<Link className={clasesBoton(...)}>`).
 * Zonas táctiles de 48 px (56 px en «grande»).
 */
export function clasesBoton({
  variante = "primario",
  tamano = "normal",
  bloque = false,
}: { variante?: Variante; tamano?: Tamano; bloque?: boolean } = {}): string {
  const medida = tamano === "grande" ? "min-h-14 px-6 text-lg" : "min-h-12 px-5";
  return [
    "inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-semibold no-underline",
    "transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    medida,
    VARIANTES[variante],
    bloque ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Rueda de carga (decorativa). La animación se para con «reducir movimiento» (globals.css). */
export function Rueda() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

/**
 * Botón de Kartana. `cargando` lo desactiva, marca `aria-busy` y enseña una rueda.
 * Props extra sobre `PropsBoton`: `bloque` (ancho completo), `name`/`value` (para formularios con varios botones)
 * y `formAction` (acción de servidor distinta a la del formulario).
 */
export function Boton({
  children,
  variante = "primario",
  tamano = "normal",
  type = "button",
  disabled = false,
  cargando = false,
  onClick,
  className = "",
  bloque = false,
  name,
  value,
  formAction,
  "aria-label": etiquetaAria,
}: PropsBoton & {
  bloque?: boolean;
  name?: string;
  value?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  "aria-label"?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      aria-label={etiquetaAria}
      name={name}
      value={value}
      formAction={formAction}
      className={`${clasesBoton({ variante, tamano, bloque })} ${className}`.trim()}
    >
      {cargando ? (
        <>
          <Rueda />
          <span className="sr-only">{t.enviando}</span>
        </>
      ) : null}
      {children}
    </button>
  );
}
