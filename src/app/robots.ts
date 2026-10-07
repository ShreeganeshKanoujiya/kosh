import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { NAV_ITEMS } from "@/config/navigation";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The app itself is behind a login; keep crawlers on the public pages.
      disallow: ["/api/", ...NAV_ITEMS.map((item) => item.href), "/forgot-password", "/reset-password"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
