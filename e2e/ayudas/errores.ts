import type { Page } from "@playwright/test";

/**
 * Recoge los errores de consola y de página (incluidos los de hidratación) de una página.
 * `ignorarRecursos`: no cuenta los «Failed to load resource» (precargas del panel a rutas que fallan por otra causa).
 */
export function vigilarErrores(page: Page, opciones: { ignorarRecursos?: boolean } = {}) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (opciones.ignorarRecursos && m.text().startsWith("Failed to load resource")) return;
    errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(e.message));
  return errores;
}

/** Peticiones con respuesta 4xx/5xx o que fallan (salvo las que cumplan `ignorar`). */
export function vigilarRespuestasFallidas(page: Page, ignorar: (ruta: string, estado: number) => boolean = () => false) {
  const fallidas: string[] = [];
  page.on("response", (r) => {
    const url = new URL(r.url());
    if (r.status() >= 400 && !ignorar(url.pathname, r.status())) fallidas.push(`${r.status()} ${url.pathname}`);
  });
  page.on("requestfailed", (r) => {
    const motivo = r.failure()?.errorText ?? "";
    // ERR_ABORTED: el navegador cancela una precarga al navegar; no es un fallo.
    if (motivo !== "net::ERR_ABORTED") fallidas.push(`FALLO ${r.url()} ${motivo}`);
  });
  return fallidas;
}
