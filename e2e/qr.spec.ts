import { existsSync } from "node:fs";
import { expect, request as playwrightRequest, test, type Page } from "@playwright/test";

// Pruebas de navegador del carril qr-pdf, con la sesión del dueño de pruebas (local `e2e-prueba`).
// Solo leen: no cambian ningún dato del local.

const SESION_DUENO = "e2e/.auth/dueno.json";
const hayCredenciales = !!process.env.E2E_EMAIL;
const SLUG = "e2e-prueba";

test.skip(() => !hayCredenciales || !existsSync(SESION_DUENO), "Sin sesión guardada: falta E2E_EMAIL o el proyecto setup");
test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });

async function irAQr(page: Page): Promise<string> {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/panel\/[0-9a-f-]{36}$/);
  const inicio = new URL(page.url()).pathname;
  await page.goto(`${inicio}/qr`);
  await expect(page).toHaveURL(/\/qr$/);
  await expect(page.getByRole("heading", { level: 1, name: "Tu QR" })).toBeVisible();
  return `${inicio}/qr`;
}

test.describe("qr-pdf", () => {
  test("la pantalla muestra el QR, la dirección y los tres formatos @movil", async ({ page }) => {
    await irAQr(page);
    await expect(page.getByRole("img", { name: "Código QR que abre tu carta" })).toBeVisible();
    await expect(page.getByText(new RegExp(`/c/${SLUG}$`)).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Copiar enlace" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir mi carta" })).toHaveAttribute("href", `/c/${SLUG}`);
    for (const nombre of ["Cartelito de mesa", "Pegatinas", "Póster"]) {
      await expect(page.getByRole("heading", { level: 2, name: nombre })).toBeVisible();
      await expect(page.getByRole("link", { name: `Descargar PDF: ${nombre}` })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Descargar solo el QR (SVG)" })).toBeVisible();
    // Sin desbordamiento horizontal.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("copiar el enlace avisa de que se ha copiado", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await irAQr(page);
    await page.getByRole("button", { name: "Copiar enlace" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Enlace copiado" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`/c/${SLUG}$`));
  });

  test("los tres PDF se descargan (200, application/pdf, %PDF, pequeños)", async ({ page }) => {
    const ruta = await irAQr(page);
    for (const formato of ["mesa", "pegatinas", "poster"]) {
      const respuesta = await page.request.get(`${ruta}/pdf?formato=${formato}`);
      expect(respuesta.status(), formato).toBe(200);
      expect(respuesta.headers()["content-type"]).toBe("application/pdf");
      expect(respuesta.headers()["content-disposition"]).toContain(`kartana-${SLUG}-${formato}.pdf`);
      const cuerpo = await respuesta.body();
      expect(cuerpo.subarray(0, 4).toString()).toBe("%PDF");
      expect(cuerpo.length).toBeLessThan(500_000);
      // Las fuentes de la marca se han incrustado (si no, el PDF saldría con Helvetica).
      expect(cuerpo.includes("Figtree"), `${formato}: sin Figtree`).toBe(true);
    }
  });

  test("el botón de la pantalla descarga el PDF de mesa @movil", async ({ page }) => {
    await irAQr(page);
    const descarga = page.waitForEvent("download");
    await page.getByRole("link", { name: "Descargar PDF: Cartelito de mesa" }).click();
    expect((await descarga).suggestedFilename()).toBe(`kartana-${SLUG}-mesa.pdf`);
  });

  test("el QR suelto se descarga en SVG", async ({ page }) => {
    const ruta = await irAQr(page);
    const respuesta = await page.request.get(`${ruta}/svg`);
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("image/svg+xml");
    const texto = await respuesta.text();
    expect(texto).toContain("<svg");
    expect(texto).not.toContain("<script");
  });

  test("un formato inválido da 400 y sin sesión da 401", async ({ page, baseURL }) => {
    const ruta = await irAQr(page);
    expect((await page.request.get(`${ruta}/pdf?formato=tarjeta`)).status()).toBe(400);
    const anonimo = await playwrightRequest.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    expect((await anonimo.get(`${ruta}/pdf?formato=mesa`)).status()).toBe(401);
    expect((await anonimo.get(`${ruta}/svg`)).status()).toBe(401);
    await anonimo.dispose();
  });
});
