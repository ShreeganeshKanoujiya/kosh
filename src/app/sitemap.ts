import type { MetadataRoute } from "next";
import { SITE, absoluteUrl } from "@/config/site";
import { HELP_ARTICLES } from "@/content/help";

/**
 * Public pages only; everything behind a login is excluded (and disallowed in robots.ts).
 * `/login` is left out too: it stays indexable for "Kosh login" searches but isn't worth a crawl.
 * `lastModified` comes from the content's own dates, never the build time, so search engines can trust it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, lastModified: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  });

  const helpUpdated = HELP_ARTICLES.reduce((latest, a) => (a.updated > latest ? a.updated : latest), "");

  return [
    page("/", SITE.contentUpdated, 1, "weekly"),
    page("/help", helpUpdated, 0.8),
    ...HELP_ARTICLES.map((a) => page(`/help/${a.slug}`, a.updated, 0.6)),
    page("/faq", SITE.contentUpdated, 0.7),
    page("/register", SITE.contentUpdated, 0.6, "yearly"),
    page("/privacy", SITE.legalUpdated, 0.3, "yearly"),
    page("/terms", SITE.legalUpdated, 0.3, "yearly"),
  ];
}
