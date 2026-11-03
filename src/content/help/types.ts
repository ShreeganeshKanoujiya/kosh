export type HelpCategoryId = "getting-started" | "recording" | "approvals" | "reports" | "administration" | "account";

export interface HelpArticle {
  slug: string;
  category: HelpCategoryId;
  title: string;
  /** One or two sentences: the article's meta description and its card text in the help center. */
  description: string;
  /** ISO date (YYYY-MM-DD) the article last changed. Feeds the sitemap and the article's structured data. */
  updated: string;
  /** Rendered inside `.doc-prose`; return direct children (p, h2, ul, …) so the prose spacing applies. */
  Body: () => React.ReactNode;
}
