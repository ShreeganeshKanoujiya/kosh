import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/** Lets phones install Kosh to the home screen; it opens straight into the app (or the login page). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    lang: "en-IN",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    // Match the light theme's viewport colour in app/layout.tsx.
    background_color: "#f5f6f8",
    theme_color: "#f5f6f8",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: SITE.logo, sizes: "512x512", type: "image/png" },
    ],
  };
}
