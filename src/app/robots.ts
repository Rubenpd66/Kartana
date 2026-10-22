import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/config/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/panel", "/admin", "/entrar", "/auth", "/api"] }],
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
