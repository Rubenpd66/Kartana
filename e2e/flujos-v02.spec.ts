import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { diccionarioCarta } from "../src/lib/i18n/carta";
import { NOMBRE_IDIOMA } from "../src/lib/i18n/idiomas";
import { hayCredenciales, idLocalDePruebas, SESION_DUENO, SLUG_E2E } from "./ayudas/datos";
import { vigilarErrores, vigilarRespuestasFallidas } from "./ayudas/errores";
import { publicarPorPanel, restaurarPublicacionPorPanel } from "./ayudas/publicar";
import {
  comprobarAlmacenamientoVacio,
  comprobarHreflang,
  hreflangsDelHead,
  IDIOMAS,
  rutaDemo,
  UA_NO_BOT,
  vigilarSalientes,
  type IdiomaCarta,
} from "./ayudas/v02";

// Pruebas de punta a punta de la v0.2 (carril qa-v02), contra el build de producción.
// Idiomas de la carta, traducción (omitida sin TRADUCCION_ACTIVA), estadísticas anónimas y privacidad.
// Lo que toca el local compartido `e2e-prueba` lo deja como estaba (publicación incluida).
// Nota: las visitas que dejan estas pruebas quedan en las estadísticas (solo contadores; no se pueden borrar desde aquí).

const hayDueno = hayCredenciales && existsSync(SESION_DUENO);
const traduccionActiva = process.env.TRADUCCION_ACTIVA === "true";

// En móvil solo corren los idiomas marcados @movil en el título.
const conMovil = (idioma: IdiomaCarta) => (idioma === "de" || idioma === "eu" ? " @movil" : "");

test.beforeEach(async ({ request }, info) => {
  if (info.title.includes("[sin demo]")) return;
  test.skip((await request.get("/c/demo", { maxRedirects: 0 })).status() === 404, "La carta demo no está cargada");
});

// ---------------------------------------------------------------- 1. Idiomas
test.describe("1 · idiomas de /c/demo", () => {
  for (const idioma of IDIOMAS) {
    test(`${idioma}: 200, lang, alérgenos, aviso, selector, canónica${conMovil(idioma)}`, async ({ page, request }) => {
      const errores = vigilarErrores(page);
      const d = diccionarioCarta(idioma);
      const ruta = rutaDemo(idioma);

      const r = await request.get(ruta, { maxRedirects: 0 });
      expect(r.status(), `GET ${ruta}`).toBe(200);
      expect(r.headers()["set-cookie"]).toBeUndefined();

      await page.goto(ruta);
      await expect(page.locator(".carta")).toHaveAttribute("lang", idioma);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Aviso fijo y botón del filtro en el idioma.
      await expect(page.locator(".aviso-fijo")).toHaveText(d.textos.avisoAlergenos);
      await expect(page.getByText(d.textos.filtrarAlergenos, { exact: true }).first()).toBeVisible();

      // Los 14 alérgenos con el nombre de ese idioma (en el filtro).
      await page.getByText(d.textos.filtrarAlergenos, { exact: true }).first().click();
      for (const nombre of Object.values(d.alergenos)) {
        await expect(page.getByRole("checkbox", { name: nombre, exact: true }), `${idioma}: ${nombre}`).toBeVisible();
      }
      // Y en al menos un plato (texto «Contiene …»).
      const lista = page.getByRole("list", { name: d.textos.contiene, exact: true }).first();
      await expect(lista).toBeAttached();
      const nombres = Object.values(d.alergenos);
      const texto = (await lista.textContent()) ?? "";
      expect(nombres.some((n) => texto.includes(n)), `${idioma}: «${texto}» debe llevar un alérgeno del diccionario`).toBe(true);

      // Canónica propia, hreflang de los 7 en el selector y x-default; no se indexa la demo.
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${ruta.replace(/\//g, "\\/")}$`));
      await comprobarHreflang(page, "demo");
      const actual = page.locator('.carta-cabecera a[aria-current="page"]');
      await expect(actual).toHaveAttribute("hreflang", idioma);
      await expect(actual).toContainText(NOMBRE_IDIOMA[idioma]);
      expect(errores).toEqual([]);
    });
  }

  test("/c/demo/es da 404 y un idioma desconocido también", async ({ request }) => {
    expect((await request.get("/c/demo/es")).status()).toBe(404);
    expect((await request.get("/c/demo/pt")).status()).toBe(404);
  });

  test("el <head> de la demo: hreflang solo con x-default (la demo no se indexa) y robots noindex", async ({ page }) => {
    await page.goto("/c/demo/de");
    const head = await hreflangsDelHead(page);
    expect(Object.keys(head)).toEqual(["x-default"]);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("los textos traducidos de la semilla salen en cada idioma (secciones distintas del español)", async ({ page }) => {
    await page.goto("/c/demo");
    const es = await page.getByRole("heading", { level: 2 }).allTextContents();
    for (const idioma of IDIOMAS.filter((i) => i !== "es")) {
      await page.goto(rutaDemo(idioma));
      const otros = await page.getByRole("heading", { level: 2 }).allTextContents();
      expect(otros.length, idioma).toBe(es.length);
      expect(otros.filter((t, i) => t !== es[i]).length, `${idioma}: títulos traducidos`).toBeGreaterThan(0);
    }
  });

  test("[sin demo] un local con idioma sin activar da 404 en ese idioma", async ({ request }) => {
    // e2e-prueba solo tiene el español activo.
    expect((await request.get(`/c/${SLUG_E2E}/de`)).status()).toBe(404);
  });
});

// ---------------------------------------------------------------- 2. Traducción automática
test.describe("2 · traducción automática", () => {
  test.skip(!traduccionActiva, "TRADUCCION_ACTIVA=false y sin clave de Google en el entorno de pruebas: no se llama a Google");
  test.skip(!hayDueno, "Sin sesión guardada");

  test("activar alemán, «Traducir lo que falta» y que la corrección manual no se pise", async () => {
    // Pendiente de activarse cuando el director encienda la traducción: ver docs/qa/v0.2.md.
    // La regla «nunca pisar una corrección manual» sin Google ya la cubre e2e/panel-idiomas.spec.ts.
    test.fixme(true, "Por escribir al encender TRADUCCION_ACTIVA");
  });
});

// ---------------------------------------------------------------- 3. Estadísticas
test.describe("3 · estadísticas anónimas", () => {
  test.skip(!hayDueno, "Sin sesión guardada: falta E2E_EMAIL o el proyecto setup");
  test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined), userAgent: UA_NO_BOT });
  test.describe.configure({ mode: "serial" });

  let localId = "";
  let estabaPublicado = true;

  test.beforeAll(async ({ browser }) => {
    localId = await idLocalDePruebas();
    const contexto = await browser.newContext({ storageState: SESION_DUENO });
    estabaPublicado = await publicarPorPanel(await contexto.newPage(), localId);
    await contexto.close();
  });
  test.afterAll(async ({ browser }) => {
    if (!localId) return;
    const contexto = await browser.newContext({ storageState: SESION_DUENO });
    await restaurarPublicacionPorPanel(await contexto.newPage(), localId, estabaPublicado);
    await contexto.close();
  });

  const cifraVisitas = (page: Page) => page.getByText("Visitas a tu carta", { exact: true }).locator("xpath=preceding-sibling::p");
  async function visitasHoy(page: Page): Promise<number> {
    await page.goto(`/panel/${localId}/estadisticas`);
    await expect(cifraVisitas(page)).toBeVisible();
    return Number(await cifraVisitas(page).textContent());
  }

  test("dos visitas a /c/e2e-prueba suben las visitas del panel; eventos inválidos no cambian nada [sin demo]", async ({ page, browser, baseURL }) => {
    test.setTimeout(120_000);
    const antes = await visitasHoy(page);

    // Dos visitas de clientes (sin sesión), que esperan a que salga el POST /api/e.
    const cliente = await browser.newContext({ userAgent: UA_NO_BOT, storageState: { cookies: [], origins: [] }, baseURL });
    const carta = await cliente.newPage();
    for (let i = 0; i < 2; i++) {
      const enviado = carta.waitForRequest((r) => new URL(r.url()).pathname === "/api/e" && r.method() === "POST");
      await carta.goto(`/c/${SLUG_E2E}`);
      await enviado;
    }
    await cliente.close();

    await expect
      .poll(() => visitasHoy(page), { timeout: 30_000, message: "las visitas de hoy deben subir 2" })
      .toBeGreaterThanOrEqual(antes + 2);
    const conVisitas = await visitasHoy(page);

    // 150 platos y un local que no existe: 204 y nada cambia en el panel.
    const ids = Array.from({ length: 150 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    const ajeno = "0b7e4f3a-1111-4222-8333-444455556666";
    const envios = [
      { tipo: "vistas", localId, idioma: "es", platos: ids },
      { tipo: "visita", localId: ajeno, idioma: "es", platos: [] },
      { tipo: "visita", localId, idioma: "xx", platos: [] },
      { tipo: "otra-cosa", localId, idioma: "es", platos: [] },
    ];
    for (const data of envios) {
      const r = await page.request.post("/api/e", { data, headers: { "user-agent": UA_NO_BOT } });
      expect(r.status(), JSON.stringify(data).slice(0, 60)).toBe(204);
    }
    await page.waitForTimeout(3000);
    expect(await visitasHoy(page)).toBe(conVisitas);
  });

  test("las páginas de idiomas y estadísticas del panel no dan errores de consola @movil", async ({ page }) => {
    const errores = vigilarErrores(page, { ignorarRecursos: true });
    const fallidas = vigilarRespuestasFallidas(page, (ruta) => /\/panel\/[^/]+\/qr$/.test(ruta));
    await page.goto(`/panel/${localId}/idiomas`);
    await expect(page.getByRole("heading", { level: 1, name: "Idiomas" })).toBeVisible();
    await page.goto(`/panel/${localId}/estadisticas`);
    await expect(page.getByRole("heading", { level: 1, name: "Visitas" })).toBeVisible();
    await page.goto(`/panel/${localId}/estadisticas?dias=30`);
    await expect(page.getByRole("heading", { level: 1, name: "Visitas" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errores).toEqual([]);
    expect(fallidas).toEqual([]);
  });
});

// ---------------------------------------------------------------- 4 y 6. Privacidad y consola de las cartas
test.describe("4 · privacidad y consola de la carta en los 7 idiomas", () => {
  test.use({ userAgent: UA_NO_BOT });
  for (const idioma of IDIOMAS) {
    test(`${idioma}: sin cookies ni almacenamiento, solo peticiones propias, consola limpia${conMovil(idioma)}`, async ({ page, baseURL }) => {
      const errores = vigilarErrores(page);
      const fallidas = vigilarRespuestasFallidas(page);
      const salientes = vigilarSalientes(page, baseURL!);
      const envio = page.waitForRequest((r) => new URL(r.url()).pathname === "/api/e" && r.method() === "POST");

      const r = await page.goto(rutaDemo(idioma));
      expect(r?.status()).toBe(200);
      expect(await r?.headerValue("set-cookie")).toBeNull();
      await envio;
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForLoadState("networkidle");

      await comprobarAlmacenamientoVacio(page);
      expect(salientes.conSetCookie()).toEqual([]);
      expect(salientes.ajenas()).toEqual([]);
      // Lo único que no es lectura de la página: el POST de estadísticas.
      expect(salientes.peticiones.filter((p) => p.startsWith("POST"))).toEqual(["POST /api/e"]);
      expect(fallidas).toEqual([]);
      expect(errores).toEqual([]);
    });
  }

  test("la carta de e2e-prueba (publicada) tampoco guarda nada [sin demo]", async ({ page, browser, baseURL }) => {
    test.skip(!hayDueno, "Necesita publicar el local de pruebas");
    const localId = await idLocalDePruebas();
    const dueno = await browser.newContext({ storageState: SESION_DUENO });
    const panel = await dueno.newPage();
    const estabaPublicado = await publicarPorPanel(panel, localId);
    try {
      const salientes = vigilarSalientes(page, baseURL!);
      const r = await page.goto(`/c/${SLUG_E2E}`);
      expect(r?.status()).toBe(200);
      await page.waitForLoadState("networkidle");
      await comprobarAlmacenamientoVacio(page);
      expect(salientes.conSetCookie()).toEqual([]);
      expect(salientes.ajenas()).toEqual([]);
    } finally {
      await restaurarPublicacionPorPanel(panel, localId, estabaPublicado);
      await dueno.close();
    }
  });
});

// ---------------------------------------------------------------- 7. Móvil, movimiento y teclado
test.describe("7 · móvil a 375 px, «reducir movimiento» y teclado en la carta", () => {
  test.use({ viewport: { width: 375, height: 800 }, reducedMotion: "reduce", userAgent: UA_NO_BOT });

  test("sin desbordamiento horizontal y sin animaciones en los 7 idiomas @movil", async ({ page }) => {
    for (const idioma of IDIOMAS) {
      await page.goto(rutaDemo(idioma));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const medidas = await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, visible: window.innerWidth }));
      expect(medidas.ancho, `${idioma}: scrollWidth`).toBeLessThanOrEqual(medidas.visible);
      const animadas = await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === "running" && Number(a.effect?.getComputedTiming().duration ?? 0) > 100).length,
      );
      expect(animadas, `${idioma}: animaciones activas`).toBe(0);
    }
  });

  test("el selector de idioma se maneja con el teclado y el foco se ve", async ({ page }) => {
    await page.goto("/c/demo");
    const resumen = page.locator(".carta-cabecera summary").first();
    await resumen.focus();
    await expect(resumen).toBeFocused();
    const contorno = await resumen.evaluate((el) => {
      const s = getComputedStyle(el);
      return { estilo: s.outlineStyle, ancho: parseFloat(s.outlineWidth), sombra: s.boxShadow };
    });
    expect((contorno.estilo !== "none" && contorno.ancho > 0) || contorno.sombra !== "none", "foco visible en el selector").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "Deutsch" })).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => (document.activeElement as HTMLAnchorElement | null)?.getAttribute("hreflang"))).toBe("es");
    await page.getByRole("link", { name: "Deutsch" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/c\/demo\/de$/);
    await expect(page.locator(".carta")).toHaveAttribute("lang", "de");
  });
});
