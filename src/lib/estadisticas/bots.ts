// Lista corta de bots que no deben contar como visitas. Solo mira el user-agent.

const PATRON_BOTS =
  /googlebot|bingbot|ahrefsbot|semrushbot|facebookexternalhit|curl\/|python-requests|yandexbot|baiduspider|duckduckbot|slurp|petalbot|mj12bot|dotbot|bot\b|crawler|spider/i;

export function esBot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim();
  if (!ua) return true;
  // Las pruebas de navegador de Playwright se marcan con @playwright y sí cuentan.
  if (/headlesschrome/i.test(ua)) return !ua.includes("@playwright");
  return PATRON_BOTS.test(ua);
}
