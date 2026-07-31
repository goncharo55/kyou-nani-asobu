import type { MetadataRoute } from "next";
import { GAMES } from "@/lib/games";
import { routing } from "@/i18n/routing";
import { LANDING_PAGES } from "@/lib/landing-pages";

const BASE_URL = "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of ["", "/quiz", "/browse"]) {
      routes.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: route === "" ? 1 : 0.8,
      });
    }
    for (const route of ["/about", "/privacy", "/terms"]) {
      routes.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.3,
      });
    }
    routes.push({
      url: `${BASE_URL}/${locale}/for`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const p of LANDING_PAGES) {
      routes.push({
        url: `${BASE_URL}/${locale}/for/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const g of GAMES) {
      routes.push({
        url: `${BASE_URL}/${locale}/games/${g.appid}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return routes;
}
