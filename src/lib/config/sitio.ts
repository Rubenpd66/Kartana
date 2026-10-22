// Datos fijos de la marca y la dirección pública. Sin secretos: se puede importar en el navegador.

export const SITIO = {
  nombre: "Kartana",
  lema: "Tu carta con QR, siempre al día. Y más reseñas en Google.",
  descripcion:
    "Carta digital con QR para bares y restaurantes: alérgenos, idiomas y cambios al instante. Y un botón limpio para conseguir más reseñas en Google.",
  correoContacto: "rubenpd66@gmail.com",
} as const;

/** Dirección pública sin barra final. En Vercel cae a la dirección del despliegue. */
export function urlSitio(): string {
  const desdeEntorno =
    process.env.NEXT_PUBLIC_SITIO_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return desdeEntorno.replace(/\/+$/, "");
}
