import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Pruebas de navegador del carril panel-local, con la sesión del dueño de pruebas (local `e2e-prueba`).
// Como la v0.1 permite un local por persona, «bienvenida -> crear local» no se puede probar de punta a
// punta aquí (está cubierto con tests de componente). Todo lo que se cambia se deja como estaba.

const SESION_DUENO = "e2e/.auth/dueno.json";
const hayCredenciales = !!process.env.E2E_EMAIL;
const SLUG = "e2e-prueba";
// La carta pública /c/... es de otro carril: las comprobaciones sobre ella solo corren cuando está integrada.
const hayCartaPublica = existsSync("src/app/(carta)");

test.skip(() => !hayCredenciales || !existsSync(SESION_DUENO), "Sin sesión guardada: falta E2E_EMAIL o el proyecto setup");
test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });
// Las pruebas cambian datos reales del mismo local: una a una.
test.describe.configure({ mode: "serial" });

async function irAlInicio(page: Page): Promise<string> {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/panel\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 2, name: "Estado de tu carta" })).toBeVisible();
  return new URL(page.url()).pathname;
}

test.describe("panel-local", () => {
  test("bienvenida: no deja continuar sin aceptar y, al aceptar, lleva al local que ya existe @movil", async ({ page }) => {
    await page.goto("/panel/bienvenida");
    const casilla = page.getByRole("checkbox", { name: /He leído y acepto/ });
    // Si el usuario de pruebas ya aceptó las versiones vigentes, la bienvenida lleva directa al inicio.
    const inicio = page.waitForURL(/\/panel\/[0-9a-f-]{36}$/).then(() => "inicio" as const);
    const paso1 = casilla.waitFor().then(() => "paso1" as const);
    if ((await Promise.race([inicio, paso1])) === "paso1") {
      await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
      await expect(page.getByRole("link", { name: /condiciones del servicio/ })).toHaveAttribute("target", "_blank");
      await casilla.check();
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page).toHaveURL(/\/panel\/[0-9a-f-]{36}$/);
    }
  });

  test("/panel lleva al inicio del único local y no se indexa @movil", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await irAlInicio(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { level: 2, name: "Para tenerla lista" })).toBeVisible();
    await expect(page.getByText(/^Acceso de cortesía/)).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("/panel/bienvenida con el local ya creado lleva al inicio", async ({ page }) => {
    await page.goto("/panel/bienvenida");
    await expect(page).toHaveURL(/\/panel\/[0-9a-f-]{36}$/);
  });

  test("la página de datos del local carga con sus cinco bloques y zonas táctiles grandes @movil", async ({ page }) => {
    const inicio = await irAlInicio(page);
    await page.goto(`${inicio}/local`);
    await expect(page.getByRole("heading", { level: 1, name: "Tu local" })).toBeVisible();
    for (const titulo of ["Datos del bar", "Dirección de la carta", "Logo", "Color de marca", "Horarios"]) {
      await expect(page.getByRole("heading", { level: 2, name: titulo })).toBeVisible();
    }
    const alto = (await page.getByRole("button", { name: "Guardar datos" }).boundingBox())?.height ?? 0;
    expect(alto).toBeGreaterThanOrEqual(48);
  });

  test("cambiar el nombre se ve en el inicio", async ({ page }) => {
    const inicio = await irAlInicio(page);
    await page.goto(`${inicio}/local`);
    const campo = page.getByLabel("Nombre", { exact: true });
    await expect(campo).toBeVisible();
    const original = await campo.inputValue();
    const nuevo = `${original} (prueba)`;
    try {
      await campo.fill(nuevo);
      await page.getByRole("button", { name: "Guardar datos" }).click();
      await expect(page.getByText("Guardado.")).toBeVisible();
      await page.goto(inicio);
      await expect(page.getByRole("heading", { level: 1, name: nuevo })).toBeVisible();
    } finally {
      await page.goto(`${inicio}/local`);
      const c = page.getByLabel("Nombre", { exact: true });
      await c.fill(original);
      await page.getByRole("button", { name: "Guardar datos" }).click();
      await expect(page.getByText("Guardado.")).toBeVisible();
    }
  });

  test("cambiar un horario lo guarda y se ve en la vista previa del propio editor y al recargar", async ({ page }) => {
    const inicio = await irAlInicio(page);
    await page.goto(`${inicio}/local`);
    const dia = page.getByRole("checkbox", { name: "Sábado: abierto" });
    await expect(dia).toBeVisible();
    const estabaAbierto = await dia.isChecked();
    const abre = page.getByLabel(/^Abre Sábado, Franja 1/);
    const cierra = page.getByLabel(/^Cierra Sábado, Franja 1/);
    const previo = estabaAbierto ? { abre: await abre.inputValue(), cierra: await cierra.inputValue() } : null;
    const guardar = page.getByRole("button", { name: "Guardar horarios" });
    try {
      if (!estabaAbierto) await dia.check();
      await abre.fill("11:30");
      await cierra.fill("15:45");
      await expect(page.getByRole("group", { name: "Así se verá" }).getByText(/11:30–15:45/)).toBeVisible();
      await guardar.click();
      await expect(page.getByText("Guardado.")).toBeVisible();

      await page.reload();
      await expect(page.getByLabel(/^Abre Sábado, Franja 1/)).toHaveValue("11:30");
      await expect(page.getByLabel(/^Cierra Sábado, Franja 1/)).toHaveValue("15:45");

      if (hayCartaPublica) {
        const r = await page.goto(`${inicio}/vista-previa`);
        expect(r?.status()).toBe(200);
        // En la carta el horario va plegado («Horario ▾»): se abre antes de mirarlo.
        await page.getByText("Horario", { exact: true }).click();
        await expect(page.getByText(/11:30–15:45/).first()).toBeVisible();
      }
    } finally {
      await page.goto(`${inicio}/local`);
      const d = page.getByRole("checkbox", { name: "Sábado: abierto" });
      await expect(d).toBeVisible();
      if (previo) {
        await page.getByLabel(/^Abre Sábado, Franja 1/).fill(previo.abre);
        await page.getByLabel(/^Cierra Sábado, Franja 1/).fill(previo.cierra);
      } else if (await d.isChecked()) {
        await d.uncheck();
      }
      await page.getByRole("button", { name: "Guardar horarios" }).click();
      await expect(page.getByText("Guardado.")).toBeVisible();
    }
  });

  test("un color demasiado claro no se puede guardar", async ({ page }) => {
    const inicio = await irAlInicio(page);
    await page.goto(`${inicio}/local`);
    // Con el servidor cargado (suite completa) el campo puede rellenarse antes de que React lo active
    // y el cambio se pierde: se repite hasta que la página responde.
    const color = page.getByLabel("O elige otro color");
    const aviso = page.getByRole("alert").filter({ hasText: "demasiado claro" });
    await expect(async () => {
      await color.fill("#000000");
      await color.fill("#ffee99");
      await expect(aviso).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Guardar color" })).toBeDisabled();
  });

  test("despublicar da 404 en la carta y volver a publicar la recupera", async ({ page }) => {
    test.skip(!hayCartaPublica, "La carta pública (/c/...) aún no está integrada");
    const inicio = await irAlInicio(page);
    const publicar = page.getByRole("button", { name: "Publicar mi carta" });
    const despublicar = page.getByRole("button", { name: "Despublicar", exact: true });
    const estabaPublicada = await despublicar.isVisible();
    try {
      if (!estabaPublicada) {
        await publicar.click();
        await expect(despublicar).toBeVisible();
      }
      expect((await page.request.get(`/c/${SLUG}`)).status()).toBe(200);

      await despublicar.click();
      await page.getByRole("button", { name: "Sí, despublicar" }).click();
      await expect(publicar).toBeVisible();
      await expect.poll(async () => (await page.request.get(`/c/${SLUG}`)).status()).toBe(404);

      await publicar.click();
      await expect(despublicar).toBeVisible();
      await expect.poll(async () => (await page.request.get(`/c/${SLUG}`)).status()).toBe(200);
    } finally {
      await page.goto(inicio);
      const publicadaAhora = await page.getByRole("button", { name: "Despublicar", exact: true }).isVisible();
      if (publicadaAhora && !estabaPublicada) {
        await page.getByRole("button", { name: "Despublicar", exact: true }).click();
        await page.getByRole("button", { name: "Sí, despublicar" }).click();
        await expect(page.getByRole("button", { name: "Publicar mi carta" })).toBeVisible();
      } else if (!publicadaAhora && estabaPublicada) {
        await page.getByRole("button", { name: "Publicar mi carta" }).click();
        await expect(page.getByRole("button", { name: "Despublicar", exact: true })).toBeVisible();
      }
    }
  });
});
