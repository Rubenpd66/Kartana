import { expect, test, type Page } from "@playwright/test";

// Recoge errores de consola y de página (incluidos los de hidratación).
function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(e.message));
  return errores;
}

test("la portada carga sin errores @movil", async ({ page }) => {
  const errores = vigilarErrores(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kartana" })).toBeVisible();
  expect(errores).toEqual([]);
});

test("las cabeceras de seguridad están presentes", async ({ request }) => {
  const r = await request.get("/");
  const h = r.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("las páginas legales cargan desde el pie", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Cookies" }).click();
  await expect(page).toHaveURL(/\/legal\/cookies$/);
  await expect(page.getByRole("heading", { level: 1, name: "Política de cookies" })).toBeVisible();
});

test("una página que no existe devuelve 404", async ({ page }) => {
  const r = await page.goto("/esto-no-existe");
  expect(r?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Esta página no existe" })).toBeVisible();
});

test("robots y sitemap responden", async ({ request }) => {
  expect((await request.get("/robots.txt")).ok()).toBe(true);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("/legal/privacidad");
});
