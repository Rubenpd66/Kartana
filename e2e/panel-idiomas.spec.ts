import { existsSync, readdirSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Pruebas de navegador del carril panel-idiomas, con la sesión del dueño de pruebas (proyecto `setup`).
// Trabajan en el local `e2e-prueba`: publican la carta, crean una sección y un plato con prefijo único,
// activan inglés y, al final, lo dejan todo como estaba (sin plato, mismos idiomas, misma publicación).
// Nunca llaman a Google: la traducción automática está apagada y solo se comprueba el aviso.

const SESION_DUENO = "e2e/.auth/dueno.json";
const SLUG = "e2e-prueba";
const hayCredenciales = !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;
const PREFIJO = `E2E ${Date.now().toString(36)}`;

// La carta pública en otros idiomas (/c/<local>/<xx>) la construye otro carril: si aún no está en esta copia,
// se omiten solo las comprobaciones sobre ella (las del panel se hacen siempre).
const RUTA_CARTA = "src/app/(carta)/c/[slug]";
const hayCartaEnIdiomas =
  existsSync(RUTA_CARTA) && readdirSync(RUTA_CARTA, { withFileTypes: true }).some((e) => e.isDirectory());

let supabase: SupabaseClient | null = null;
let localId = "";

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

function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("response", (r) => {
    const ruta = new URL(r.url()).pathname;
    if (r.status() >= 400 && /^\/panel\/[^/]+\/idiomas(\/|$)/.test(ruta)) errores.push(`${r.status()} ${ruta}`);
  });
  return errores;
}

const rutaIdiomas = () => `/panel/${localId}/idiomas`;

async function abrirIdiomas(page: Page) {
  await page.goto(rutaIdiomas());
  await expect(page.getByRole("heading", { level: 1, name: "Idiomas" })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Español" })).toBeVisible();
}

async function publicarSiHaceFalta(page: Page): Promise<boolean> {
  await page.goto(`/panel/${localId}`);
  const publicar = page.getByRole("button", { name: "Publicar mi carta" });
  const despublicar = page.getByRole("button", { name: "Despublicar", exact: true });
  await expect(publicar.or(despublicar)).toBeVisible();
  const estabaPublicada = await despublicar.isVisible();
  if (!estabaPublicada) {
    await publicar.click();
    await expect(despublicar).toBeVisible();
  }
  return estabaPublicada;
}

async function despublicar(page: Page) {
  await page.goto(`/panel/${localId}`);
  const publicar = page.getByRole("button", { name: "Publicar mi carta" });
  const despublicarBoton = page.getByRole("button", { name: "Despublicar", exact: true });
  await expect(publicar.or(despublicarBoton)).toBeVisible();
  if (await despublicarBoton.isVisible()) {
    await despublicarBoton.click();
    await page.getByRole("button", { name: "Sí, despublicar" }).click();
    await expect(publicar).toBeVisible();
  }
}

async function guardarIdiomas(page: Page) {
  await page.getByRole("button", { name: "Guardar idiomas" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();
}

async function idiomasActivos(): Promise<string[]> {
  const cliente = await clienteDueno();
  const { data } = await cliente.from("locales").select("idiomas_activos").eq("id", localId).single();
  return (data as { idiomas_activos: string[] }).idiomas_activos;
}

test.describe("panel de idiomas", () => {
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
  });

  test("la pantalla de idiomas bloquea el español y avisa de que la traducción automática no está @movil", async ({ page }) => {
    const errores = vigilarErrores(page);
    await abrirIdiomas(page);
    const es = page.getByRole("switch", { name: "Español" });
    await expect(es).toBeDisabled();
    await expect(es).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("la información de alérgenos es responsabilidad del establecimiento")).toBeVisible();

    const traducir = page.getByRole("button", { name: "Traducir lo que falta" });
    await expect(traducir).toBeVisible();
    // Sin clave de Google la traducción automática está apagada: botón desactivado y explicación.
    if (await traducir.isDisabled()) {
      await expect(page.getByText(/traducción automática aún no está disponible/).first()).toBeVisible();
    }
    // Sin desbordamiento horizontal en el móvil.
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(desborda).toBe(false);
    expect(errores).toEqual([]);
  });

  test("activar inglés, corregir un plato a mano y que el cambio del español avise sin pisar la corrección @movil", async ({ page }) => {
    test.setTimeout(150_000);
    const errores = vigilarErrores(page);
    const seccion = `${PREFIJO} Tapas`;
    const plato = `${PREFIJO} Bravas`;
    const platoCambiado = `${PREFIJO} Bravas nuevas`;
    const correccion = `${PREFIJO} Spicy potatoes`;
    const activosAntes = await idiomasActivos();
    const inglesAntes = activosAntes.includes("en");
    let estabaPublicada = true;

    try {
      estabaPublicada = await publicarSiHaceFalta(page);

      // Una sección y un plato para tener algo que traducir.
      await page.goto(`/panel/${localId}/carta`);
      await expect(page.getByRole("heading", { level: 1, name: "Tu carta" })).toBeVisible();
      await page.getByRole("button", { name: /^(\+ Nueva sección|Crear la primera sección)$/ }).click();
      const dialogo = page.getByRole("dialog", { name: "Nueva sección" });
      await expect(dialogo).toBeVisible();
      await dialogo.getByLabel("Nombre de la sección").fill(seccion);
      await dialogo.getByRole("button", { name: "Guardar" }).click();
      await expect(dialogo).toBeHidden();
      await page.getByRole("link", { name: `+ Añadir plato a «${seccion}»` }).click();
      await expect(page.getByRole("heading", { level: 1, name: "Nuevo plato" })).toBeVisible();
      await page.getByLabel("Nombre del plato").fill(plato);
      await page.getByLabel("Precio", { exact: true }).fill("3,75");
      await page.getByLabel(/He revisado los alérgenos/).check();
      await page.getByRole("button", { name: "Guardar" }).click();
      await expect(page.getByText(`«${plato}» guardado.`)).toBeVisible();

      // Activar inglés: la carta inglesa responde 200.
      await abrirIdiomas(page);
      const ingles = page.getByRole("switch", { name: "English" });
      if ((await ingles.getAttribute("aria-checked")) !== "true") await ingles.click();
      await expect(ingles).toHaveAttribute("aria-checked", "true");
      await guardarIdiomas(page);
      await expect(page.getByRole("heading", { level: 3, name: "English" })).toBeVisible();
      if (hayCartaEnIdiomas) await expect.poll(async () => (await page.request.get(`/c/${SLUG}/en`)).status()).toBe(200);

      // Corregir a mano el nombre del plato en inglés.
      await page.getByRole("link", { name: /Revisar textos/ }).first().click();
      await expect(page).toHaveURL(/\/idiomas\/en$/);
      await expect(page.getByRole("heading", { level: 1, name: "Textos en English" })).toBeVisible();
      const tarjeta = page.getByRole("region", { name: `Plato: ${plato}` });
      await expect(tarjeta).toBeVisible();
      await tarjeta.getByLabel("Nombre en English").fill(correccion);
      await tarjeta.getByRole("button", { name: "Guardar", exact: true }).click();
      await expect(tarjeta.getByText("Corregida por ti")).toBeVisible();
      await expect(tarjeta.getByText("Guardado.").first()).toBeVisible();
      if (hayCartaEnIdiomas) await expect.poll(async () => (await page.request.get(`/c/${SLUG}/en`)).text()).toContain(correccion);

      // Cambiar el nombre en español: se avisa y la corrección sigue en la carta inglesa.
      await page.goto(`/panel/${localId}/carta`);
      await page.getByRole("link", { name: `Editar ${plato}` }).click();
      await expect(page.getByRole("heading", { level: 1, name: "Editar plato" })).toBeVisible();
      await page.getByLabel("Nombre del plato").fill(platoCambiado);
      await page.getByRole("button", { name: "Guardar" }).click();
      await expect(page.getByText(`«${platoCambiado}» guardado.`)).toBeVisible();

      await page.goto(`${rutaIdiomas()}/en`);
      const tarjetaNueva = page.getByRole("region", { name: `Plato: ${platoCambiado}` });
      await expect(tarjetaNueva.getByText("Revisa: el español cambió")).toBeVisible();
      await expect(tarjetaNueva.getByLabel("Nombre en English")).toHaveValue(correccion);
      await abrirIdiomas(page);
      await expect(page.getByText("1 corrección tuya para revisar")).toBeVisible();
      if (hayCartaEnIdiomas) {
        const carta = await page.request.get(`/c/${SLUG}/en`);
        expect(carta.status()).toBe(200);
        expect(await carta.text()).toContain(correccion);
      }
    } finally {
      // Dejarlo como estaba: sin plato ni sección, mismos idiomas, misma publicación.
      await page.goto(`/panel/${localId}/carta`);
      const editar = page.getByRole("button", { name: `Editar sección «${seccion}»` });
      await expect(editar.or(page.getByText("Empieza tu carta"))).toBeVisible();
      if (await editar.isVisible()) {
        await editar.click();
        const edicion = page.getByRole("dialog", { name: "Editar sección" });
        await edicion.getByRole("button", { name: "Borrar sección" }).click();
        await page.getByRole("dialog", { name: `¿Borrar la sección «${seccion}»?` }).getByRole("button", { name: "Sí, borrar" }).click();
        await expect(editar).toHaveCount(0);
      }
      if (!inglesAntes) {
        await abrirIdiomas(page);
        const ingles = page.getByRole("switch", { name: "English" });
        if ((await ingles.getAttribute("aria-checked")) === "true") await ingles.click();
        await guardarIdiomas(page);
        expect(await idiomasActivos()).toEqual(activosAntes);
      }
      if (!estabaPublicada) await despublicar(page);
    }
    expect(errores).toEqual([]);
  });
});
