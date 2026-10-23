import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  asegurarPublicado,
  hayCredenciales,
  idLocalDePruebas,
  limpiarPorPrefijo,
  restaurarPublicado,
  SESION_DUENO,
  SLUG_E2E,
} from "./ayudas/datos";
import { vigilarErrores, vigilarRespuestasFallidas } from "./ayudas/errores";

// Pruebas de punta a punta de la v0.1 (carril qa-v01), contra el build de producción.
// Los bloques que escriben datos usan el local compartido `e2e-prueba`: comprueban si está publicado, lo publican
// solo durante la prueba y lo dejan como estaba; todo lo creado lleva un prefijo único y se borra siempre (afterAll).

const PREFIJO = `QA ${Date.now().toString(36)}`;
const DEMO = "/c/demo";
const hayDueno = hayCredenciales && existsSync(SESION_DUENO);

// ---------------------------------------------------------------- 1. Flujo del dueño
test.describe("1 · flujo del dueño", () => {
  test.skip(() => !hayDueno, "Sin sesión guardada: falta E2E_EMAIL o el proyecto setup");
  test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });

  let localId = "";
  let estabaPublicado = true;

  test.beforeAll(async () => {
    localId = await idLocalDePruebas();
    ({ estabaPublicado } = await asegurarPublicado(localId));
  });
  test.afterAll(async () => {
    if (!localId) return;
    await limpiarPorPrefijo(localId, PREFIJO);
    await restaurarPublicado(localId, estabaPublicado);
  });

  test("crear plato con ½ y ración y alérgenos, verlo en la carta, marcarlo agotado y borrar la sección @movil", async ({ page }) => {
    const errores = vigilarErrores(page, { ignorarRecursos: true });
    const seccion = `${PREFIJO} QA`;
    const plato = `${PREFIJO} Croqueta QA`;

    // /panel lleva al local.
    await page.goto("/panel");
    await expect(page).toHaveURL(new RegExp(`/panel/${localId}$`));
    await page.getByRole("navigation").getByRole("link", { name: "Carta" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Tu carta" })).toBeVisible();

    // Sección.
    await page.getByRole("button", { name: /^(\+ Nueva sección|Crear la primera sección)$/ }).click();
    const dialogo = page.getByRole("dialog", { name: "Nueva sección" });
    await dialogo.getByLabel("Nombre de la sección").fill(seccion);
    await dialogo.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("heading", { level: 2, name: seccion })).toBeVisible();

    // Plato con dos precios y dos alérgenos confirmados.
    await page.getByRole("link", { name: `+ Añadir plato a «${seccion}»` }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Nuevo plato" })).toBeVisible();
    await page.getByLabel("Nombre del plato").fill(plato);
    await page.getByRole("button", { name: "½ y ración" }).click();
    await page.getByLabel("Precio de ½ ración").fill("1,50");
    await page.getByLabel("Precio de Ración").fill("2,80");
    const alergenos = page.getByRole("group", { name: "Alérgenos", exact: true });
    await alergenos.getByRole("button", { name: "Cereales con gluten" }).click();
    await alergenos.getByRole("button", { name: "Leche y derivados" }).click();
    await page.getByLabel(/He revisado los alérgenos/).check();
    await page.getByRole("button", { name: "Guardar" }).click();
    const guardadoEn = Date.now();
    await expect(page.getByText(`«${plato}» guardado.`)).toBeVisible();

    // En la carta pública, al recargar (sin esperar), con los dos precios y los alérgenos con nombre.
    const respuesta = await page.goto(`/c/${SLUG_E2E}`);
    expect(respuesta?.status()).toBe(200);
    const enCarta = page.locator("li, article").filter({ hasText: plato }).last();
    await expect(enCarta).toBeVisible({ timeout: 5_000 });
    const segundos = (Date.now() - guardadoEn) / 1000;
    test.info().annotations.push({ type: "tiempo", description: `Guardar -> verlo en la carta: ${segundos.toFixed(1)} s` });
    console.log(`Tiempo entre guardar y verlo en la carta: ${segundos.toFixed(1)} s`);
    await expect(enCarta).toContainText("1,50");
    await expect(enCarta).toContainText("2,80");
    await expect(enCarta).toContainText("Cereales con gluten");
    await expect(enCarta).toContainText("Leche y derivados");
    await expect(enCarta).not.toContainText("Agotado");

    // Agotado en el panel -> la carta lo dice al recargar.
    await page.goto(`/panel/${localId}/carta`);
    const agotado = page.getByRole("button", { name: `Agotado: ${plato}` });
    await agotado.click();
    await expect(agotado).toHaveAttribute("aria-pressed", "true");
    await page.waitForLoadState("networkidle");
    await page.goto(`/c/${SLUG_E2E}`);
    await expect(page.locator("li, article").filter({ hasText: plato }).last()).toContainText("Agotado");

    // Borrar la sección desde la interfaz.
    await page.goto(`/panel/${localId}/carta`);
    await page.getByRole("button", { name: `Editar sección «${seccion}»` }).click();
    await page.getByRole("dialog", { name: "Editar sección" }).getByRole("button", { name: "Borrar sección" }).click();
    await page.getByRole("dialog", { name: `¿Borrar la sección «${seccion}»?` }).getByRole("button", { name: "Sí, borrar" }).click();
    await expect(page.getByRole("heading", { level: 2, name: seccion })).toHaveCount(0);
    await page.goto(`/c/${SLUG_E2E}`);
    await expect(page.getByText(plato)).toHaveCount(0);
    expect(errores).toEqual([]);
  });
});

// ---------------------------------------------------------------- 2. Cliente
test.describe("2 · cliente en la carta de ejemplo", () => {
  test.beforeEach(async ({ request }) => {
    test.skip((await request.get(DEMO, { maxRedirects: 0 })).status() === 404, "La carta demo no está cargada");
  });

  test("banda de ejemplo, aviso fijo, chips de secciones y filtro con trazas @movil", async ({ page }) => {
    await page.goto(DEMO);
    await expect(page.getByText("Carta de ejemplo", { exact: false }).first()).toBeVisible();

    // El aviso fijo sigue visible al hacer scroll hasta el final.
    const aviso = page.locator(".aviso-fijo");
    await expect(aviso).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(aviso).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, 0));

    // Un chip lleva a su sección.
    const nav = page.getByRole("navigation", { name: "Secciones" });
    await nav.getByRole("link", { name: "Cazuelas" }).click();
    await expect(page).toHaveURL(/#seccion-/);
    await expect(page.getByRole("heading", { level: 2, name: "Cazuelas" })).toBeInViewport();

    // Filtro: «Crustáceos» oculta gambas y langostinos.
    const gamba = page.getByRole("heading", { level: 3, name: "Gamba roja a la plancha" });
    const langostino = page.getByRole("heading", { level: 3, name: "Langostino a la plancha" });
    const bravas = page.getByRole("heading", { level: 3, name: "Patatas bravas" });
    await page.getByText("Filtrar por alérgenos").click();
    await page.getByRole("checkbox", { name: "Crustáceos" }).check();
    await expect(gamba).toBeHidden();
    await expect(langostino).toBeHidden();
    await expect(bravas).toBeVisible();

    // «Incluir trazas»: las bravas solo pueden contener trazas de gluten.
    await page.getByRole("checkbox", { name: "Crustáceos" }).uncheck();
    await page.getByRole("checkbox", { name: "Cereales con gluten" }).check();
    await expect(bravas).toBeVisible();
    await page.getByRole("checkbox", { name: /trazas/ }).check();
    await expect(bravas).toBeHidden();
    await page.getByRole("checkbox", { name: /trazas/ }).uncheck();
    await expect(bravas).toBeVisible();

    // Quitar filtro.
    await page.getByRole("checkbox", { name: "Crustáceos" }).check();
    await expect(gamba).toBeHidden();
    await page.getByRole("button", { name: "Quitar filtro" }).click();
    await expect(gamba).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Crustáceos" })).not.toBeChecked();
  });
});

// ---------------------------------------------------------------- 3. Privacidad
test.describe("3 · privacidad de la carta pública", () => {
  for (const ruta of [DEMO, `/c/${SLUG_E2E}`]) {
    test(`sin cookies ni almacenamiento ni terceros en ${ruta}`, async ({ page, request }, info) => {
      // El local de pruebas solo tiene carta pública si está publicado: se comprueba, no se supone.
      const estado = (await request.get(ruta, { maxRedirects: 0 })).status();
      test.skip(estado === 404, `${ruta} no está disponible (404): el local no está publicado`);

      const encabezados = (await request.get(ruta)).headers();
      expect(encabezados["set-cookie"], "la respuesta no debe traer Set-Cookie").toBeUndefined();

      const propio = new URL(info.project.use.baseURL!).origin;
      const ajenos: string[] = [];
      const conCookie: string[] = [];
      page.on("request", (r) => {
        const u = new URL(r.url());
        if (u.origin !== propio && !u.hostname.endsWith(".supabase.co")) ajenos.push(r.url());
      });
      page.on("response", async (r) => {
        if ((await r.headerValue("set-cookie")) !== null) conCookie.push(r.url());
      });
      await page.goto(ruta, { waitUntil: "networkidle" });
      expect(await page.evaluate(() => document.cookie)).toBe("");
      expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
      expect(await page.evaluate(async () => (await indexedDB.databases?.())?.length ?? 0)).toBe(0);
      expect((await page.context().cookies()).length).toBe(0);
      expect(conCookie).toEqual([]);
      expect(ajenos).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------- 4. Errores y rutas protegidas
test.describe("4 · errores y rutas protegidas", () => {
  test("404 real en /c/no-existe", async ({ page }) => {
    const r = await page.goto("/c/no-existe");
    expect(r?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Esta carta no está disponible ahora mismo" })).toBeVisible();
  });

  test("/panel sin sesión lleva a /entrar?siguiente=%2Fpanel @movil", async ({ page }) => {
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/entrar\?siguiente=%2Fpanel$/);
    await expect(page.getByRole("heading", { level: 1, name: "Entra en tu panel" })).toBeVisible();
  });

  test.describe("con la sesión del dueño", () => {
    test.skip(() => !hayDueno, "Sin sesión guardada");
    test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });

    test("/admin da 404 al dueño (se ve «404»; el estado HTTP es 200 por el streaming de Cache Components)", async ({ page }) => {
      await page.goto("/admin");
      await expect(page.getByText("404", { exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: "Locales" })).toHaveCount(0);
    });
  });
});

// ---------------------------------------------------------------- 5. SEO básico
test.describe("5 · SEO básico", () => {
  const robots = (page: Page) => page.locator('meta[name="robots"]').evaluateAll((m) => m.map((e) => e.getAttribute("content") ?? ""));

  test("/entrar no se indexa", async ({ page }) => {
    await page.goto("/entrar");
    expect((await robots(page)).join(",")).toMatch(/noindex/);
  });

  test("/admin sin sesión no se indexa ni enseña nada", async ({ page }) => {
    const r = await page.goto("/admin");
    expect([404, 200]).toContain(r?.status());
    expect((await robots(page)).join(",")).toMatch(/noindex/);
  });

  test("la demo no se indexa y tiene canónica y JSON-LD parseable", async ({ page, request }) => {
    test.skip((await request.get(DEMO, { maxRedirects: 0 })).status() === 404, "La carta demo no está cargada");
    await page.goto(DEMO);
    expect((await robots(page)).join(",")).toMatch(/noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/c\/demo$/);
    const bloques = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(bloques.length).toBeGreaterThan(0);
    for (const b of bloques) expect(() => JSON.parse(b)).not.toThrow();
  });

  test("robots.txt y sitemap.xml responden, y robots enlaza el sitemap", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.ok()).toBe(true);
    expect(await r.text()).toMatch(/Sitemap:/i);
    const s = await request.get("/sitemap.xml");
    expect(s.ok()).toBe(true);
    expect(await s.text()).toContain("<urlset");
  });

  test.describe("con la sesión del dueño", () => {
    test.skip(() => !hayDueno, "Sin sesión guardada");
    test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });

    test("las páginas del panel no se indexan", async ({ page }) => {
      const localId = await idLocalDePruebas();
      for (const ruta of ["", "/carta", "/menu", "/local", "/vista-previa"]) {
        await page.goto(`/panel/${localId}${ruta}`);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        expect((await robots(page)).join(","), `/panel/<id>${ruta}`).toMatch(/noindex/);
      }
    });
  });
});

// ---------------------------------------------------------------- 6. Consola limpia
test.describe("6 · consola limpia en las páginas públicas", () => {
  for (const ruta of ["/", "/entrar", "/legal/privacidad", "/legal/condiciones", "/legal/cookies", "/legal/aviso-legal", DEMO, "/c/no-existe", "/esto-no-existe"]) {
    test(`sin errores de consola ni de hidratación en ${ruta} @movil`, async ({ page }) => {
      const errores = vigilarErrores(page, { ignorarRecursos: ruta.includes("no-existe") });
      await page.goto(ruta, { waitUntil: "networkidle" });
      await expect(page.locator("body")).toBeVisible();
      expect(errores).toEqual([]);
    });
  }

  test.describe("panel con la sesión del dueño", () => {
    test.skip(() => !hayDueno, "Sin sesión guardada");
    test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });

    test("sin errores ni peticiones fallidas en las páginas del panel @movil", async ({ page }) => {
      const localId = await idLocalDePruebas();
      // «Failed to load resource» no dice qué ruta; el detalle va en `fallidas`, que sí se comprueba.
      const errores = vigilarErrores(page, { ignorarRecursos: true });
      const fallidas = vigilarRespuestasFallidas(page);
      for (const ruta of ["", "/carta", "/carta/plato/nuevo", "/menu", "/menu/nuevo", "/local", "/vista-previa", "/qr"]) {
        const r = await page.goto(`/panel/${localId}${ruta}`, { waitUntil: "networkidle" });
        // /qr es de otro carril (qr-pdf): si aún no está integrado da 404 y no es un fallo de este bloque.
        if (ruta === "/qr" && r?.status() === 404) continue;
        expect(r?.status(), `/panel/<id>${ruta}`).toBe(200);
      }
      await page.goto("/panel/cuenta", { waitUntil: "networkidle" });
      console.log("Respuestas fallidas en el panel:", fallidas);
      expect(errores).toEqual([]);
      expect(fallidas.filter((f) => !f.includes("/qr"))).toEqual([]);
    });
  });
});
