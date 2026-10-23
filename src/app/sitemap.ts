import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/config/sitio";
import { listarCartasIndexables } from "@/lib/datos/publico";

// Archivo del director. Cartas: solo las publicadas, con acceso, que permiten indexar y tienen ≥ 5 platos
// (listarCartasIndexables, cacheada; se invalida con ETIQUETA_LISTA_CARTAS). En la v0.1 solo en español.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlSitio();
  const cartas = await listarCartasIndexables();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/legal/aviso-legal`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/condiciones`, changeFrequency: "yearly", priority: 0.2 },
    ...cartas.map((c) => ({
      url: `${base}/c/${c.slug}`,
      lastModified: c.actualizadoEn,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
