import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// La comprobación de admin ocurre dentro de <Suspense> (Cache Components): la respuesta ya va con
// estado 200 y la página «no encontrada» llega por streaming. Se comprueba lo que ve la persona.
async function expectNoEncontrada(page: Page) {
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Locales" })).toHaveCount(0);
}

// Pruebas de navegador del carril admin. Con sesión necesitan E2E_ADMIN_EMAIL y el proyecto `setup`.

const SESION_ADMIN = "e2e/.auth/admin.json";
const SESION_DUENO = "e2e/.auth/dueno.json";
const hayAdmin = !!process.env.E2E_ADMIN_EMAIL;

test.describe("sin sesión", () => {
  test("/admin da 404 y no redirige a /entrar @movil", async ({ page }) => {
    await page.goto("/admin");
    await expectNoEncontrada(page);
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe("con la sesión del dueño de pruebas", () => {
  test.skip(() => !existsSync(SESION_DUENO), "Sin sesión del dueño guardada");
  test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });

  test("/admin da 404", async ({ page }) => {
    await page.goto("/admin");
    await expectNoEncontrada(page);
  });
});

test.describe("con la sesión del administrador", () => {
  test.skip(() => !hayAdmin || !existsSync(SESION_ADMIN), "Sin sesión de admin: falta E2E_ADMIN_EMAIL o el proyecto setup");
  test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_ADMIN) ? SESION_ADMIN : undefined) });
  test.describe.configure({ mode: "serial" });

  test("lista los locales con su estado, no se indexa y filtra @movil", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Locales" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const tarjeta = page.locator("article", { hasText: "/c/e2e-prueba" });
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByText(/^(Cortesía|Piloto|Prueba|Vencido)/).first()).toBeVisible();

    await page.getByRole("link", { name: "Vencidos" }).click();
    await expect(page).toHaveURL(/\?estado=vencido$/);
    await expect(page.locator("article", { hasText: "/c/e2e-prueba" })).toHaveCount(0);
  });

  test("activar piloto cambia el estado y la fecha; después vuelve a cortesía", async ({ page }) => {
    await page.goto("/admin");
    const tarjeta = page.locator("article", { hasText: "/c/e2e-prueba" });
    await expect(tarjeta).toBeVisible();
    try {
      await tarjeta.getByRole("button", { name: /piloto 60 días/ }).click();
      await expect(tarjeta.getByText(/Piloto · vence el \d{2}\/\d{2}\/\d{4} \(quedan \d+ días\)/).first()).toBeVisible();
      await expect(tarjeta.getByRole("status")).toContainText("ahora está en Piloto");
      await expect(tarjeta.getByRole("button", { name: "Renovar piloto 60 días desde hoy" })).toBeVisible();
    } finally {
      // Se restaura desde la misma tarjeta (sin recargar: una página recargada podía mostrar aún
      // «Cortesía», ocultar el botón y dejar el local en piloto sin que nadie se enterase).
      const dar = tarjeta.getByRole("button", { name: "Dar cortesía" });
      if (await dar.count()) {
        await dar.click();
        await expect(tarjeta.getByRole("status")).toContainText("Cortesía");
      }
    }
    // Y queda guardado de verdad: al recargar sigue en cortesía.
    await page.reload();
    await expect(page.locator("article", { hasText: "/c/e2e-prueba" }).getByText("Cortesía · sin fin").first()).toBeVisible();
  });
});
