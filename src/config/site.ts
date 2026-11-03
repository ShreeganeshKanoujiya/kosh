/**
 * Public-site details: the landing, FAQ, help and legal pages, plus SEO metadata.
 * Read at build time (these pages are static), so set APP_URL before `next build`.
 * Server-only values: don't import this into client components.
 */
export const SITE = {
  name: "Kosh",
  url: (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, ""),
  title: "Kosh — Petty cash management for Indian businesses",
  tagline: "Expenses in Control.",
  /** Default meta description (keep it under ~160 characters). */
  description:
    "Kosh is petty cash software for Indian businesses. Scan UPI screenshots, attach bills, approve expenses and export reports — with a full audit trail.",
  keywords: [
    "petty cash software",
    "petty cash management",
    "petty cash app India",
    "expense management",
    "expense approval",
    "UPI expense tracker",
    "UPI screenshot scanner",
    "cash book",
    "office expenses",
    "small business accounting",
  ],
  /** ISO date the landing and FAQ pages last changed (sitemap `lastModified`). */
  contentUpdated: "2026-10-07",
  /** ISO date shown as "Last updated" on the legal pages. Change it whenever their text changes. */
  legalUpdated: "2026-10-07",
  /** Square brand logo, used by the web app manifest and the Organization structured data. */
  logo: "/icon-512.png",
  /** Ownership tokens for Google Search Console and Bing Webmaster Tools (HTML-tag method). */
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    bing: process.env.BING_SITE_VERIFICATION || undefined,
  },
} as const;

export const absoluteUrl = (path = "/") => `${SITE.url}${path === "/" ? "" : path}`;

/** JSON for a `<script type="application/ld+json">`; `<` is escaped so the data can't close the tag. */
export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
