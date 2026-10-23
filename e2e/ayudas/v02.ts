import { expect, type Page } from "@playwright/test";
import { IDIOMAS_CARTA, type IdiomaCarta } from "../../src/lib/i18n/idiomas";

// Ayudas de la v0.2 (carril qa-v02): idiomas de la carta, almacenamiento vacío y peticiones salientes.

export const IDIOMAS = IDIOMAS_CARTA;
export type { IdiomaCarta };

/** Un navegador normal: «HeadlessChrome» a secas se descarta como bot, salvo que lleve la marca @playwright. */
export const UA_NO_BOT =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 @playwright";

export const rutaDemo = (idioma: IdiomaCarta) => (idioma === "es" ? "/c/demo" : `/c/demo/${idioma}`);

/** hreflang de los enlaces del selector de idioma (siempre los 7, en orden). */
export async function hreflangsDelSelector(page: Page): Promise<string[]> {
  return page.locator(".carta-cabecera a[hreflang]").evaluateAll((as) => as.map((a) => a.getAttribute("hreflang") ?? ""));
}

/** Los `<link rel="alternate" hreflang>` del `<head>` como { idioma: ruta }. */
export async function hreflangsDelHead(page: Page): Promise<Record<string, string>> {
  return page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) =>
    Object.fromEntries(ls.map((l) => [l.getAttribute("hreflang") ?? "", new URL((l as HTMLLinkElement).href).pathname])),
  );
}

/** Comprueba que el selector tiene los 7 idiomas y que el `<head>` trae `x-default` apuntando a la española. */
export async function comprobarHreflang(page: Page, slug: string) {
  expect(await hreflangsDelSelector(page)).toEqual([...IDIOMAS]);
  const head = await hreflangsDelHead(page);
  expect(head["x-default"]).toBe(`/c/${slug}`);
}

/** Cookies, localStorage, sessionStorage, IndexedDB, cachés y service workers vacíos. */
export async function comprobarAlmacenamientoVacio(page: Page) {
  expect(await page.evaluate(() => document.cookie), "document.cookie").toBe("");
  expect((await page.context().cookies()).length, "cookies del contexto").toBe(0);
  const guardado = await page.evaluate(async () => ({
    local: localStorage.length,
    sesion: sessionStorage.length,
    bases: typeof indexedDB.databases === "function" ? (await indexedDB.databases()).length : 0,
    cache: "caches" in window ? (await caches.keys()).length : 0,
    workers: (await navigator.serviceWorker?.getRegistrations?.())?.length ?? 0,
  }));
  expect(guardado).toEqual({ local: 0, sesion: 0, bases: 0, cache: 0, workers: 0 });
}

/**
 * Registra las peticiones salientes de una página. `ajenas()` devuelve los dominios que no son la propia web
 * ni Supabase (API/bucket de imágenes); `conSetCookie()` las respuestas que intentan fijar una cookie.
 */
export function vigilarSalientes(page: Page, urlBase: string) {
  const propio = new URL(urlBase).host;
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : "";
  const hosts = new Set<string>();
  const setCookie: string[] = [];
  const peticiones: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.protocol === "data:" || u.protocol === "blob:") return;
    hosts.add(u.host);
    peticiones.push(`${r.method()} ${u.pathname}`);
  });
  page.on("response", async (r) => {
    if ((await r.headerValue("set-cookie")) !== null) setCookie.push(new URL(r.url()).pathname);
  });
  return {
    peticiones,
    ajenas: () => [...hosts].filter((h) => h !== propio && h !== supabase),
    conSetCookie: () => setCookie,
  };
}
