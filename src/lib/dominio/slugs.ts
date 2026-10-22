import { LIMITES } from "./limites";

/** La carta de demostración. Reservado para usuarios: solo la semilla puede crearlo. */
export const SLUG_DEMO = "demo";

/** Igual que privado.es_slug_reservado() en SQL (docs/arquitectura.md §4.4). */
export const SLUGS_RESERVADOS = [
  "admin",
  "api",
  "app",
  "auth",
  "ayuda",
  "blog",
  "c",
  "carta",
  "cartas",
  "contacto",
  SLUG_DEMO,
  "ejemplo",
  "entrar",
  "kartana",
  "legal",
  "login",
  "panel",
  "precios",
  "privacidad",
  "r",
  "registro",
  "salir",
  "soporte",
  "static",
  "www",
  "es",
  "en",
  "fr",
  "de",
  "ca",
  "eu",
  "gl",
  "_next",
] as const;

const FORMATO_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Texto libre -> slug: minúsculas, sin acentos (ñ -> n), guiones simples, máximo 40. Puede devolver "". */
export function normalizarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`´]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITES.slugMax)
    .replace(/-+$/g, "");
}

export function esSlugReservado(slug: string): boolean {
  return (SLUGS_RESERVADOS as readonly string[]).includes(slug);
}

export function validarSlug(slug: string): { valido: true } | { valido: false; motivo: "formato" | "reservado" } {
  if (slug.length < LIMITES.slugMin || slug.length > LIMITES.slugMax || !FORMATO_SLUG.test(slug)) {
    return { valido: false, motivo: "formato" };
  }
  if (esSlugReservado(slug)) return { valido: false, motivo: "reservado" };
  return { valido: true };
}
