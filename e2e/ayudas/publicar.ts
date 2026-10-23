import { expect, type Page } from "@playwright/test";

/**
 * Publica el local desde el panel (así se invalida la caché de la carta; cambiar la columna por SQL no basta:
 * la carta seguiría dando 404) y devuelve si ya estaba publicado, para dejarlo como estaba después.
 */
export async function publicarPorPanel(page: Page, localId: string): Promise<boolean> {
  await page.goto(`/panel/${localId}`);
  const publicar = page.getByRole("button", { name: "Publicar mi carta" });
  const despublicar = page.getByRole("button", { name: "Despublicar", exact: true });
  await expect(publicar.or(despublicar)).toBeVisible();
  const estabaPublicado = await despublicar.isVisible();
  if (!estabaPublicado) {
    await publicar.click();
    await expect(despublicar).toBeVisible();
  }
  return estabaPublicado;
}

export async function restaurarPublicacionPorPanel(page: Page, localId: string, estabaPublicado: boolean) {
  if (estabaPublicado) return;
  await page.goto(`/panel/${localId}`);
  const publicar = page.getByRole("button", { name: "Publicar mi carta" });
  const despublicar = page.getByRole("button", { name: "Despublicar", exact: true });
  await expect(publicar.or(despublicar)).toBeVisible();
  if (await despublicar.isVisible()) {
    await despublicar.click();
    await page.getByRole("button", { name: "Sí, despublicar" }).click();
    await expect(publicar).toBeVisible();
  }
}
