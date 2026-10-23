import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Pruebas de navegador del carril estadisticas, con la sesión del dueño de pruebas (local `e2e-prueba`).
// La prueba de «las visitas suben» publica el local un momento (sin eso el servidor no cuenta nada) y lo deja como estaba.

const SESION_DUENO = "e2e/.auth/dueno.json";
const hayCredenciales = !!process.env.E2E_EMAIL;
// Un navegador normal: «HeadlessChrome» a secas se descarta como bot, salvo que lleve la marca @playwright.
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 @playwright";

test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });
test.describe.configure({ mode: "serial" });

async function irAEstadisticas(page: Page): Promise<{ inicio: string; localId: string }> {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/panel\/[0-9a-f-]{36}$/);
  const inicio = new URL(page.url()).pathname;
  await page.goto(`${inicio}/estadisticas`);
  await expect(page).toHaveURL(/\/estadisticas$/);
  await expect(page.getByRole("heading", { level: 1, name: "Visitas" })).toBeVisible();
  return { inicio, localId: inicio.split("/").pop()! };
}

const cifraVisitas = (page: Page) => page.getByText("Visitas a tu carta", { exact: true }).locator("xpath=preceding-sibling::p");

test.describe("estadisticas: servidor (sin sesión)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const evento = { tipo: "visita", localId: "0b7e4f3a-1111-4222-8333-444455556666", idioma: "es", platos: [] };

  test("POST /api/e válido responde 204 sin cookies", async ({ request }) => {
    const r = await request.post("/api/e", { data: evento, headers: { "user-agent": UA } });
    expect(r.status()).toBe(204);
    expect(r.headers()["set-cookie"]).toBeUndefined();
    expect(r.headers()["cache-control"]).toContain("no-store");
  });

  test("cuerpo basura, vacío o enorme también da 204", async ({ request }) => {
    for (const data of ["esto no es json", "", JSON.stringify({ ...evento, x: "a".repeat(6000) })]) {
      const r = await request.post("/api/e", { data, headers: { "user-agent": UA, "content-type": "application/json" } });
      expect(r.status()).toBe(204);
    }
  });

  test("GET no está permitido", async ({ request }) => {
    expect((await request.get("/api/e")).status()).toBe(405);
  });
});

test.describe("estadisticas: panel", () => {
  test.skip(() => !hayCredenciales || !existsSync(SESION_DUENO), "Sin sesión guardada: falta E2E_EMAIL o el proyecto setup");

  test("la página carga con gráfico, números y selector de rango @movil", async ({ page }) => {
    const { inicio } = await irAEstadisticas(page);
    await expect(page.getByRole("img", { name: /^Visitas por día/ })).toBeVisible();
    await expect(page.getByText("Ver los números")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Idiomas de tus visitas" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Platos más vistos" })).toBeVisible();
    await expect(page.getByText("sin cookies y sin saber quién es nadie")).toBeVisible();
    await expect(page.getByRole("link", { name: "7 días" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("link", { name: "30 días" }).click();
    await expect(page).toHaveURL(/dias=30/);
    await expect(page.getByRole("link", { name: "30 días" })).toHaveAttribute("aria-current", "page");
    await page.getByText("Ver los números").click();
    await expect(page.getByRole("table").first()).toBeVisible();
    expect(await page.locator("table tbody tr").count()).toBeGreaterThanOrEqual(30);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    // Un rango inventado vuelve a 7 días.
    await page.goto(`${inicio}/estadisticas?dias=999`);
    await expect(page.getByRole("link", { name: "7 días" })).toHaveAttribute("aria-current", "page");
  });

  test("sin sesión, la página lleva a entrar", async ({ browser, page }) => {
    const { inicio } = await irAEstadisticas(page);
    const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const otra = await contexto.newPage();
    await otra.goto(`${inicio}/estadisticas`);
    await expect(otra).toHaveURL(/\/entrar/);
    await contexto.close();
  });

  test("tras registrar una visita, las visitas de hoy suben", async ({ page }) => {
    const { inicio, localId } = await irAEstadisticas(page);
    await page.goto(inicio);
    const publicar = page.getByRole("button", { name: "Publicar mi carta" });
    const despublicar = page.getByRole("button", { name: "Despublicar", exact: true });
    await expect(publicar.or(despublicar)).toBeVisible();
    const estabaPublicada = await despublicar.isVisible();
    try {
      if (!estabaPublicada) {
        await publicar.click();
        await expect(despublicar).toBeVisible();
      }
      await page.goto(`${inicio}/estadisticas`);
      await expect(cifraVisitas(page)).toBeVisible();
      const antes = Number(await cifraVisitas(page).textContent());

      const r = await page.request.post("/api/e", {
        data: { tipo: "visita", localId, idioma: "en", platos: [] },
        headers: { "user-agent": UA },
      });
      expect(r.status()).toBe(204);

      await expect
        .poll(
          async () => {
            await page.reload();
            await expect(cifraVisitas(page)).toBeVisible();
            return Number(await cifraVisitas(page).textContent());
          },
          { timeout: 20_000 },
        )
        .toBeGreaterThan(antes);
      await expect(page.getByText("English")).toBeVisible();
    } finally {
      await page.goto(inicio);
      await expect(publicar.or(despublicar)).toBeVisible();
      if (!estabaPublicada && (await despublicar.isVisible())) {
        await despublicar.click();
        await page.getByRole("button", { name: "Sí, despublicar" }).click();
        await expect(publicar).toBeVisible();
      }
    }
  });
});
