import { expect, test as setup } from "@playwright/test";

// Proyecto `setup` de Playwright: inicia sesión UNA vez por ejecución con cada usuario de prueba
// (vía POST /auth/e2e, que solo existe en local/CI) y guarda las cookies para el resto de pruebas.
// Sin credenciales (E2E_EMAIL vacío) se salta: las pruebas que necesitan sesión también se saltan.

export const SESION_DUENO = "e2e/.auth/dueno.json";
export const SESION_ADMIN = "e2e/.auth/admin.json";

const PERFILES = [
  { quien: "dueno", archivo: SESION_DUENO },
  { quien: "admin", archivo: SESION_ADMIN },
] as const;

for (const { quien, archivo } of PERFILES) {
  setup(`sesión de pruebas: ${quien}`, async ({ request }) => {
    setup.skip(!process.env.E2E_EMAIL, "Sin credenciales de prueba (E2E_EMAIL)");
    const respuesta = await request.post("/auth/e2e", { data: { quien } });
    expect(respuesta.status(), "POST /auth/e2e debe responder 204 (¿E2E_ACCESO=true en el servidor?)").toBe(204);
    await request.storageState({ path: archivo });
  });
}
