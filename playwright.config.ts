import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Pruebas de navegador en escritorio y móvil.
// - El proyecto móvil solo ejecuta las pruebas marcadas con @movil en el título.
// - Pocos workers: con el servidor cargado las pruebas fallan al azar (lección 8).
// - Por defecto prueba el build de producción (build + start), no el modo desarrollo.
// - El proyecto `setup` guarda la sesión de los usuarios de prueba (e2e/sesion.setup.ts).
//   En local, las credenciales E2E_* salen de .env.local; en CI, de los secretos de GitHub.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const puerto = Number(process.env.PUERTO_E2E ?? 3100);
const urlBase = process.env.URL_E2E ?? `http://localhost:${puerto}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: process.env.CI ? "github" : "list",
  outputDir: "test-results",
  use: { baseURL: urlBase, trace: "on-first-retry", locale: "es-ES" },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    { name: "escritorio", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
    { name: "movil", use: { ...devices["Pixel 7"] }, grep: /@movil/, dependencies: ["setup"] },
  ],
  webServer: process.env.URL_E2E
    ? undefined
    : {
        command: `npm run start -- -p ${puerto}`,
        url: `${urlBase}/robots.txt`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
