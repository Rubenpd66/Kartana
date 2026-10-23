// Pestañas del panel de un local. Carril acceso en la v0.1; del director desde la v0.2.

import { panelEs } from "@/lib/i18n/panel.es";

export type ClavePanel = "inicio" | "carta" | "menu" | "idiomas" | "estadisticas" | "local" | "qr";
/** Nombre del icono: lo dibuja src/componentes/panel/IconoPanel.tsx. */
export type IconoPanel = "casa" | "carta" | "calendario" | "globo" | "grafico" | "tienda" | "qr";

export type ElementoNavegacion = {
  clave: ClavePanel;
  etiqueta: string;
  ruta: (localId: string) => string;
  icono: IconoPanel;
};

const t = panelEs.navegacion;

export const NAVEGACION_PANEL: readonly ElementoNavegacion[] = [
  { clave: "inicio", etiqueta: t.inicio, ruta: (id) => `/panel/${id}`, icono: "casa" },
  { clave: "carta", etiqueta: t.carta, ruta: (id) => `/panel/${id}/carta`, icono: "carta" },
  { clave: "menu", etiqueta: t.menu, ruta: (id) => `/panel/${id}/menu`, icono: "calendario" },
  { clave: "idiomas", etiqueta: t.idiomas, ruta: (id) => `/panel/${id}/idiomas`, icono: "globo" },
  { clave: "estadisticas", etiqueta: t.estadisticas, ruta: (id) => `/panel/${id}/estadisticas`, icono: "grafico" },
  { clave: "local", etiqueta: t.local, ruta: (id) => `/panel/${id}/local`, icono: "tienda" },
  { clave: "qr", etiqueta: t.qr, ruta: (id) => `/panel/${id}/qr`, icono: "qr" },
];

/** Quita un prefijo de idioma de dos letras (/en/panel → /panel) y la barra final. */
function normalizar(ruta: string): string {
  return ruta.replace(/^\/[a-z]{2}(?=\/panel(\/|$))/, "").replace(/\/+$/, "") || "/";
}

/** Pestaña que corresponde a `rutaActual` (sin prefijo de idioma). Inicio solo en la ruta exacta. */
export function pestanaActiva(rutaActual: string, localId: string): ClavePanel | null {
  const ruta = normalizar(rutaActual);
  for (const e of NAVEGACION_PANEL) {
    const destino = e.ruta(localId);
    if (e.clave === "inicio" ? ruta === destino : ruta === destino || ruta.startsWith(`${destino}/`)) return e.clave;
  }
  return null;
}
