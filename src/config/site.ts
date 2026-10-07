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
  /** Shown as "Last updated" on the legal pages. Change it whenever their text changes. */
  legalUpdated: "7 October 2026",
} as const;

export const absoluteUrl = (path = "/") => `${SITE.url}${path === "/" ? "" : path}`;

/** JSON for a `<script type="application/ld+json">`; `<` is escaped so the data can't close the tag. */
export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
