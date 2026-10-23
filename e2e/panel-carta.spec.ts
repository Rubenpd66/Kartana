import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Pruebas de navegador del carril panel-carta, con la sesión del dueño de pruebas (proyecto `setup`).
// Trabajan en el local de pruebas `e2e-prueba`: crean secciones, platos y menús con un prefijo único
// y lo borran todo al final (desde la interfaz y, por si una prueba falla a medias, también en afterAll).

const SESION_DUENO = "e2e/.auth/dueno.json";
const SLUG = "e2e-prueba";
const hayCredenciales = !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;
const PREFIJO = `E2E ${Date.now().toString(36)}`;

let supabase: SupabaseClient | null = null;
let localId = "";

/** Cliente con la sesión del dueño de pruebas (la RLS le deja ver y tocar solo lo suyo). */
async function clienteDueno(): Promise<SupabaseClient> {
  if (supabase) return supabase;
  const cliente = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await cliente.auth.signInWithPassword({ email: process.env.E2E_EMAIL!, password: process.env.E2E_PASSWORD! });
  if (error) throw new Error(`No se pudo entrar con el dueño de pruebas: ${error.message}`);
  supabase = cliente;
  return cliente;
}

/**
 * Errores de consola y de página (incluidos los de hidratación) y respuestas fallidas de las rutas de este carril.
 * Los 404 de otras rutas del panel se ignoran: la navegación precarga pestañas de otros carriles
 * (inicio, local, QR, vista previa) que en una copia sin integrar todavía no existen.
 */
function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("response", (r) => {
    const ruta = new URL(r.url()).pathname;
    if (r.status() >= 400 && /^\/panel\/[^/]+\/(carta|menu)(\/|$)/.test(ruta)) errores.push(`${r.status()} ${ruta}`);  });
  return errores;
}

const rutaCarta = () => `/panel/${localId}/carta`;

async function abrirCarta(page: Page) {
  await page.goto(rutaCarta());
  await expect(page.getByRole("heading", { level: 1, name: "Tu carta" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver mi carta" })).toBeVisible();
}

async function crearSeccion(page: Page, nombre: string) {
  await page.getByRole("button", { name: /^(\+ Nueva sección|Crear la primera sección)$/ }).click();
  const dialogo = page.getByRole("dialog", { name: "Nueva sección" });
  await expect(dialogo).toBeVisible();
  await dialogo.getByLabel("Nombre de la sección").fill(nombre);
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(dialogo).toBeHidden();
  await expect(page.getByRole("heading", { level: 2, name: nombre })).toBeVisible();
}

async function crearPlatoSimple(page: Page, seccion: string, nombre: string, precio: string) {
  await page.getByRole("link", { name: `+ Añadir plato a «${seccion}»` }).click();
  await expect(page).toHaveURL(/\/carta\/plato\/nuevo\?seccion=/);
  await expect(page.getByRole("heading", { level: 1, name: "Nuevo plato" })).toBeVisible();
  await page.getByLabel("Nombre del plato").fill(nombre);
  await page.getByLabel("Precio", { exact: true }).fill(precio);
  await page.getByLabel(/He revisado los alérgenos/).check();
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page).toHaveURL(/\/carta\?guardado=/);
  await expect(page.getByText(`«${nombre}» guardado.`)).toBeVisible();
}

async function borrarSeccion(page: Page, nombre: string) {
  await page.getByRole("button", { name: `Editar sección «${nombre}»` }).click();
  const dialogo = page.getByRole("dialog", { name: "Editar sección" });
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole("button", { name: "Borrar sección" }).click();
  const confirmar = page.getByRole("dialog", { name: `¿Borrar la sección «${nombre}»?` });
  await expect(confirmar).toBeVisible();
  await confirmar.getByRole("button", { name: "Sí, borrar" }).click();
  await expect(page.getByRole("heading", { level: 2, name: nombre })).toHaveCount(0);
}

/** La carta pública solo existe si el local está publicado (y, en esta copia, si existe la ruta /c/…). */
async function cartaPublicaDisponible(page: Page): Promise<boolean> {
  const r = await page.request.get(`/c/${SLUG}`);
  return r.ok();
}

test.describe("panel de la carta", () => {
  test.skip(() => !hayCredenciales || !existsSync(SESION_DUENO), "Sin sesión guardada: falta E2E_EMAIL o el proyecto setup");
  test.use({ storageState: async ({}, usar) => usar(existsSync(SESION_DUENO) ? SESION_DUENO : undefined) });

  test.beforeAll(async () => {
    const cliente = await clienteDueno();
    const { data, error } = await cliente.from("locales").select("id").eq("slug", SLUG).maybeSingle();
    if (error || !data) throw new Error(`Falta el local de pruebas «${SLUG}» del dueño de pruebas`);
    localId = (data as { id: string }).id;
  });

  // Red de seguridad: si una prueba falla a medias, borra lo que creó esta ejecución (y solo eso).
  test.afterAll(async () => {
    if (!supabase || !localId) return;
    await supabase.from("secciones").delete().eq("local_id", localId).like("nombre", `${PREFIJO}%`);
    await supabase.from("menus").delete().eq("local_id", localId).like("nombre", `${PREFIJO}%`);
  });

  test("crear sección y plato con «½ y ración» y dos alérgenos, marcar agotado y borrarlo", async ({ page }) => {
    const errores = vigilarErrores(page);
    const seccion = `${PREFIJO} Tapas`;
    const plato = `${PREFIJO} Patatas bravas`;
    await abrirCarta(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await crearSeccion(page, seccion);

    await page.getByRole("link", { name: `+ Añadir plato a «${seccion}»` }).click();
    await expect(page).toHaveURL(/\/carta\/plato\/nuevo\?seccion=/);
    await expect(page.getByRole("heading", { level: 1, name: "Nuevo plato" })).toBeVisible();
    await page.getByLabel("Nombre del plato").fill(plato);
    await page.getByRole("button", { name: "½ y ración" }).click();
    await page.getByLabel("Precio de ½ ración").fill("2,25");
    await page.getByLabel("Precio de Ración").fill("3.75");
    const alergenos = page.getByRole("group", { name: "Alérgenos", exact: true });
    await alergenos.getByRole("button", { name: "Huevos" }).click();
    await alergenos.getByRole("button", { name: "Leche y derivados" }).click();
    await expect(alergenos.getByRole("button", { name: "Huevos" })).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel(/He revisado los alérgenos/).check();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(/\/carta\?guardado=/);
    await expect(page.getByText(`«${plato}» guardado.`)).toBeVisible();
    const fila = page.locator('li[id^="plato-"]').filter({ hasText: plato });
    await expect(fila).toContainText("½ 2,25 € · Ración 3,75 €");
    await expect(fila.getByRole("img", { name: "Huevos" })).toBeVisible();
    await expect(fila.getByRole("img", { name: "Leche y derivados" })).toBeVisible();

    // Vista previa (carril carta-publica): solo si ya existe en esta copia.
    const previa = await page.request.get(`/panel/${localId}/vista-previa`);
    if (previa.ok()) {
      await page.goto(`/panel/${localId}/vista-previa`);
      await expect(page.getByText(plato)).toBeVisible();
      await abrirCarta(page);
    }

    // Agotado de un toque: se guarda (sobrevive a recargar).
    const agotado = page.getByRole("button", { name: `Agotado: ${plato}` });
    await expect(agotado).toHaveAttribute("aria-pressed", "false");
    await agotado.click();
    await expect(agotado).toHaveAttribute("aria-pressed", "true");
    await expect(agotado).toHaveText("Agotado");
    // Espera a que la acción termine (la página se vuelve a pintar con el dato del servidor).
    await page.waitForLoadState("networkidle");
    await page.reload();
    await expect(page.getByRole("button", { name: `Agotado: ${plato}` })).toHaveAttribute("aria-pressed", "true");

    // Prueba clave de caché: la carta pública lo muestra agotado al recargar (si el local está publicado).
    if (await cartaPublicaDisponible(page)) {
      await page.goto(`/c/${SLUG}`);
      const enCarta = page.locator("li, article").filter({ hasText: plato }).last();
      await expect(enCarta).toContainText("Agotado");
      await expect(enCarta).toContainText("3,75");
      await abrirCarta(page);
    }

    await borrarSeccion(page, seccion);
    expect(errores).toEqual([]);
  });

  test("ordenar dos platos con las flechas @movil", async ({ page }) => {
    const seccion = `${PREFIJO} Orden`;
    const primero = `${PREFIJO} Croquetas`;
    const segundo = `${PREFIJO} Calamares`;
    await abrirCarta(page);
    await crearSeccion(page, seccion);
    await crearPlatoSimple(page, seccion, primero, "6");
    await crearPlatoSimple(page, seccion, segundo, "8,50");

    const nombres = () =>
      page
        .getByRole("listitem")
        .filter({ has: page.getByRole("heading", { level: 2, name: seccion }) })
        .getByRole("link", { name: new RegExp(`^Editar ${PREFIJO}`) })
        .allTextContents();
    expect((await nombres()).map((n) => n.includes("Croquetas"))).toEqual([true, false]);

    await page.getByRole("button", { name: "Ordenar" }).click();
    await page.getByRole("button", { name: `Bajar ${primero}` }).click();
    await expect.poll(async () => (await nombres()).map((n) => n.includes("Calamares"))).toEqual([true, false]);
    await page.waitForLoadState("networkidle");
    await page.reload();
    await expect(page.getByRole("heading", { level: 2, name: seccion })).toBeVisible();
    expect((await nombres()).map((n) => n.includes("Calamares"))).toEqual([true, false]);

    await borrarSeccion(page, seccion);
  });

  test("crear y borrar un menú del día @movil", async ({ page }) => {
    const menu = `${PREFIJO} Menú`;
    await page.goto(`/panel/${localId}/menu`);
    await expect(page.getByRole("heading", { level: 1, name: "Menús del día" })).toBeVisible();
    await page.getByRole("link", { name: /^(\+ Nuevo menú|Crear el menú del día)$/ }).click();
    await expect(page).toHaveURL(/\/menu\/nuevo$/);
    await expect(page.getByRole("heading", { level: 1, name: "Nuevo menú del día" })).toBeVisible();

    await page.getByLabel("Nombre del menú").fill(menu);
    await page.getByLabel("Precio", { exact: true }).fill("12,50");
    await page.getByLabel("Primeros: plato 1", { exact: true }).fill("Lentejas");
    await page.getByLabel("Segundos: plato 1", { exact: true }).fill("Merluza a la plancha");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(/\/menu\?guardado=/);
    await expect(page.getByText(`«${menu}» guardado.`)).toBeVisible();
    const enlace = page.getByRole("link", { name: new RegExp(menu) });
    await expect(enlace).toContainText("12,50 € · L–V · Todo el día");

    await enlace.click();
    await expect(page).toHaveURL(/\/menu\/[0-9a-f-]{36}$/);
    await expect(page.getByLabel("Primeros: plato 1", { exact: true })).toHaveValue("Lentejas");
    await page.getByRole("button", { name: "Borrar menú" }).click();
    const confirmar = page.getByRole("dialog", { name: `¿Borrar «${menu}»?` });
    await confirmar.getByRole("button", { name: "Sí, borrar" }).click();
    await expect(page).toHaveURL(/\/menu\?borrado=1$/);
    await expect(page.getByText("Menú borrado.")).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(menu) })).toHaveCount(0);
  });
});
