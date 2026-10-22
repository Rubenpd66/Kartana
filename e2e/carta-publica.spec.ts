import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SESION_DUENO = "e2e/.auth/dueno.json";
const hayCredenciales = !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;

// Pruebas de navegador del carril carta-publica (build de producción).
// La mayoría usan la carta de demostración (/c/demo, semilla supabase/semillas/demo.sql). Si todavía no está
// cargada en la base de datos, /c/demo da 404 y estas pruebas se saltan con un aviso.

const DEMO = "/c/demo";

function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(e.message));
  return errores;
}

async function saltarSinDemo(request: APIRequestContext) {
  const r = await request.get(DEMO, { maxRedirects: 0 });
  test.skip(r.status() === 404, "La carta de demostración no está cargada (supabase/semillas/demo.sql): /c/demo da 404");
}

test.describe("carta de demostración", () => {
  test.beforeEach(async ({ request }) => {
    await saltarSinDemo(request);
  });

  test("/c/demo carga sin errores, con h1, aviso fijo y banda de ejemplo @movil", async ({ page }) => {
    const errores = vigilarErrores(page);
    const r = await page.goto(DEMO);
    expect(r?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cafetería La Guagua");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByText("Carta de ejemplo", { exact: false }).first()).toBeVisible();
    const aviso = page.locator(".aviso-fijo");
    await expect(aviso).toHaveText("Consulte al personal sobre alérgenos");
    await expect(aviso).toBeInViewport();
    // Sigue visible al bajar hasta la mitad de la carta.
    await page.getByRole("heading", { level: 2, name: "Postres" }).scrollIntoViewIfNeeded();
    await expect(aviso).toBeInViewport();
    expect(errores).toEqual([]);
  });

  test("el filtro oculta los platos con crustáceos y «Quitar filtro» los devuelve @movil", async ({ page }) => {
    await page.goto(DEMO);
    const gamba = page.getByRole("heading", { level: 3, name: "Gamba roja a la plancha" });
    const bravas = page.getByRole("heading", { level: 3, name: "Patatas bravas" });
    await expect(gamba).toBeVisible();

    await page.getByText("Filtrar por alérgenos").click();
    const crustaceos = page.getByRole("checkbox", { name: "Crustáceos" });
    await expect(crustaceos).toBeVisible();
    await crustaceos.check();

    await expect(gamba).toBeHidden();
    await expect(bravas).toBeVisible();

    await page.getByRole("button", { name: "Quitar filtro" }).click();
    await expect(crustaceos).not.toBeChecked();
    await expect(gamba).toBeVisible();
  });

  test("las anclas de secciones llevan a su sección", async ({ page }) => {
    await page.goto(DEMO);
    const nav = page.getByRole("navigation", { name: "Secciones" });
    await nav.getByRole("link", { name: "Postres" }).click();
    await expect(page).toHaveURL(/#seccion-/);
    await expect(page.getByRole("heading", { level: 2, name: "Postres" })).toBeInViewport();
  });

  test("sin cookies ni almacenamiento en el móvil del cliente", async ({ page, request }) => {
    const r = await request.get(DEMO);
    expect(r.headers()["set-cookie"]).toBeUndefined();
    await page.goto(DEMO);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.cookie)).toBe("");
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
    expect((await page.context().cookies()).length).toBe(0);
  });

  test("noindex (la demo no se indexa), canónica y JSON-LD válido", async ({ page }) => {
    await page.goto(DEMO);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/c\/demo$/);
    const json = await page.locator('script[type="application/ld+json"]').textContent();
    const datos = JSON.parse(json ?? "");
    expect(datos["@type"]).toBe("Restaurant");
    expect(datos.name).toBe("Cafetería La Guagua");
    expect(datos.hasMenu.hasMenuSection.length).toBeGreaterThan(0);
  });

  test("peso: solo recursos propios y poco JavaScript", async ({ page }, info) => {
    const ajenos: string[] = [];
    const propio = new URL(info.project.use.baseURL!).origin;
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.origin !== propio && !url.hostname.endsWith(".supabase.co")) {
        ajenos.push(req.url());
      }
    });
    await page.goto(DEMO, { waitUntil: "load" });
    const pesos = await page.evaluate(() => {
      const recursos = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const navegacion = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const js = recursos.filter((r) => r.initiatorType === "script" || r.name.endsWith(".js"));
      return {
        jsKb: Math.round(js.reduce((t, r) => t + r.transferSize, 0) / 1024),
        totalKb: Math.round((recursos.reduce((t, r) => t + r.transferSize, 0) + navegacion.transferSize) / 1024),
        htmlKb: Math.round(navegacion.transferSize / 1024),
      };
    });
    info.annotations.push({ type: "peso", description: `JS ${pesos.jsKb} KB · HTML ${pesos.htmlKb} KB · total ${pesos.totalKb} KB` });
    console.log(`Peso de /c/demo: JS ${pesos.jsKb} KB, HTML ${pesos.htmlKb} KB, total ${pesos.totalKb} KB (transferidos)`);
    expect(ajenos).toEqual([]);
    // El JS es el del propio Next/React (igual en todas las páginas); la carta no añade JS propio.
    expect(pesos.jsKb).toBeLessThan(250);
  });
});

test("un slug que no existe devuelve 404 y no se indexa @movil", async ({ page }) => {
  const r = await page.goto("/c/no-existe-xyz");
  expect(r?.status()).toBe(404);
  // Next añade su propio noindex a los 404; el de generateMetadata es «noindex, nofollow».
  const robots = await page.locator('meta[name="robots"]').evaluateAll((m) => m.map((e) => e.getAttribute("content")));
  expect(robots.length).toBeGreaterThan(0);
  for (const contenido of robots) expect(contenido).toMatch(/noindex/);
  await expect(page.getByRole("heading", { level: 1, name: "Esta carta no está disponible ahora mismo" })).toBeVisible();
});

test("un slug con formato no válido también devuelve 404", async ({ request }) => {
  expect((await request.get("/c/NO_VALE")).status()).toBe(404);
});

test.describe("vista previa con la sesión del dueño de pruebas", () => {
  test.skip(!hayCredenciales, "Sin credenciales de prueba (E2E_EMAIL, E2E_PASSWORD)");
  test.use({ storageState: hayCredenciales && existsSync(SESION_DUENO) ? SESION_DUENO : undefined });

  test("enseña la carta sin publicar con la banda «aún no está publicada» @movil", async ({ page }) => {
    const localId = await idLocalDelDueno();
    test.skip(!localId, "El dueño de pruebas no tiene local");
    const errores = vigilarErrores(page);
    const fallidas: string[] = [];
    page.on("response", (r) => r.status() === 404 && fallidas.push(new URL(r.url()).pathname));
    await page.goto(`/panel/${localId}/vista-previa`);
    await expect(page.getByText("Así verán tu carta (aún no está publicada)")).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    // Con platos, la carta entera; sin platos, el estado vacío con el enlace a «Carta».
    await expect(page.getByRole("heading", { level: 1 }).or(page.getByRole("link", { name: "Ir a la carta" })).first()).toBeVisible();
    // Las precargas de la navegación del panel a páginas de otros carriles que aún no existen dan 404: no son de la vista previa.
    console.log("404 en la vista previa:", fallidas);
    expect(fallidas.filter((ruta) => ruta.endsWith("/vista-previa"))).toEqual([]);
    expect(errores.filter((e) => !e.startsWith("Failed to load resource"))).toEqual([]);
  });
});

/** Id del local del dueño de pruebas, leído con su propia sesión (la RLS solo le deja ver lo suyo). */
async function idLocalDelDueno(): Promise<string | null> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sesion, error } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_EMAIL!,
    password: process.env.E2E_PASSWORD!,
  });
  if (error || !sesion.user) return null;
  const { data } = await supabase.from("locales").select("id").eq("dueno_id", sesion.user.id).limit(1).maybeSingle();
  await supabase.auth.signOut();
  return (data as { id: string } | null)?.id ?? null;
}

test("sin sesión, la vista previa lleva a /entrar", async ({ page }) => {
  await page.goto("/panel/3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c/vista-previa");
  await expect(page).toHaveURL(/\/entrar\?siguiente=/);
  await expect(page.getByRole("heading", { level: 1, name: "Entra en tu panel" })).toBeVisible();
});
