import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/config/sitio";

// Archivo del director. Las cartas públicas se añadirán aquí cuando exista su consulta.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlSitio();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/legal/aviso-legal`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/condiciones`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
