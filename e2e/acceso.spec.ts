import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Pruebas de navegador del carril acceso.
// Las que llevan sesión necesitan E2E_EMAIL en el entorno de Playwright y el proyecto `setup`
// (e2e/sesion.setup.ts) en playwright.config.ts; sin ellos se saltan.

const SESION_DUENO = "e2e/.auth/dueno.json";
const hayCredenciales = !!process.env.E2E_EMAIL;

function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(e.message));
  return errores;
}

test.describe("sin sesión", () => {
  test("/entrar carga sin errores de consola y no se indexa @movil", async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto("/entrar");
    await expect(page.getByRole("heading", { level: 1, name: "Entra en tu panel" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByLabel("Tu correo")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("el correo se valida en el navegador antes de enviar", async ({ page }) => {
    await page.goto("/entrar");
    const correo = page.getByLabel("Tu correo");
    await expect(correo).toBeVisible();
    await correo.fill("esto-no-es-un-correo");
    await page.getByRole("button", { name: "Enviarme el código" }).click();
    expect(await correo.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
    await expect(page.getByRole("heading", { level: 1, name: "Entra en tu panel" })).toBeVisible();
  });

  test("sin sesión, /panel/cuenta lleva a /entrar con siguiente @movil", async ({ page }) => {
    await page.goto("/panel/cuenta");
    await expect(page).toHaveURL(/\/entrar\?siguiente=%2Fpanel%2Fcuenta$/);
    await expect(page.getByRole("heading", { level: 1, name: "Entra en tu panel" })).toBeVisible();
  });

  test("/auth/salir no acepta GET", async ({ request }) => {
    const r = await request.get("/auth/salir", { maxRedirects: 0 });
    expect(r.status()).toBe(405);
  });

  test("/auth/callback sin código va a /auth/error, nunca fuera de la web", async ({ request }) => {
    const r = await request.get("/auth/callback?siguiente=%2F%2Fmalo.com", { maxRedirects: 0 });
    expect(r.status()).toBe(307);
    expect(new URL(r.headers()["location"]).pathname).toBe("/auth/error");
  });
});

test.describe("paso del código (envía un correo real al usuario de prueba)", () => {
  test.skip(!hayCredenciales, "Sin credenciales de prueba (E2E_EMAIL)");

  test("el código se valida en el navegador y el servidor rechaza uno incorrecto", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("Tu correo").fill(process.env.E2E_EMAIL!);
    await page.getByRole("button", { name: "Enviarme el código" }).click();

    const paso2 = page.getByRole("heading", { level: 1, name: "Escribe el código" });
    const limite = page.getByRole("alert").filter({ hasText: "Espera un minuto" });
    await expect(paso2.or(limite)).toBeVisible();
    test.skip(await limite.isVisible(), "Supabase limita un código por minuto: se probará en la siguiente ejecución");

    const codigo = page.getByLabel("Código de 6 cifras");
    await codigo.fill("12ab");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    expect(await codigo.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
    await expect(paso2).toBeVisible();

    await codigo.fill("000000");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    // Ojo: Next añade su propio role="alert" vacío (anunciador de rutas); se filtra por texto.
    await expect(page.getByRole("alert").filter({ hasText: /no es correcto|Demasiados intentos/ })).toBeVisible();
    await expect(page).toHaveURL(/\/entrar/);
  });
});

test.describe("con la sesión del dueño de pruebas", () => {
  // Se evalúa al ejecutar (después del proyecto `setup`), no al listar las pruebas.
  test.skip(() => !hayCredenciales || !existsSync(SESION_DUENO), "Sin sesión guardada: falta E2E_EMAIL o el proyecto setup");
  test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });

  test("/panel/cuenta muestra el correo y no se indexa @movil", async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto("/panel/cuenta");
    await expect(page.getByRole("heading", { level: 1, name: "Tu cuenta" })).toBeVisible();
    await expect(page.getByText(process.env.E2E_EMAIL!, { exact: true })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("/admin da 404 al dueño de pruebas", async ({ page }) => {
    const r = await page.goto("/admin");
    expect(r?.status()).toBe(404);
  });
});

test.describe("salir", () => {
  test.skip(!hayCredenciales, "Sin credenciales de prueba (E2E_EMAIL)");

  // Sesión propia (no la compartida): «Salir» la revoca y no debe afectar al resto de pruebas.
  test("«Salir» cierra la sesión y lleva a la portada", async ({ page }) => {
    const r = await page.request.post("/auth/e2e", { data: { quien: "dueno" } });
    expect(r.status()).toBe(204);
    await page.goto("/panel/cuenta");
    await expect(page.getByText(process.env.E2E_EMAIL!, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/panel/cuenta");
    await expect(page).toHaveURL(/\/entrar\?siguiente=/);
  });
});
