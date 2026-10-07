import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { HELP_ARTICLES } from "@/content/help";

/** Public pages only; everything behind a login is excluded (and disallowed in robots.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "weekly"),
    page("/help", 0.8),
    ...HELP_ARTICLES.map((a) => page(`/help/${a.slug}`, 0.6)),
    page("/faq", 0.7),
    page("/register", 0.6, "yearly"),
    page("/login", 0.4, "yearly"),
    page("/privacy", 0.3, "yearly"),
    page("/terms", 0.3, "yearly"),
  ];
}
