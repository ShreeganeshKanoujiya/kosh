import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HELP_ARTICLES, HELP_CATEGORIES, articlesIn, getHelpArticle, helpCategory } from "@/content/help";
import { absoluteUrl, jsonLd } from "@/config/site";
import { formatDate } from "@/lib/format";
import { ORGANIZATION_ID, WEBSITE_ID, organizationJsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/help/[slug]">) {
  const article = getHelpArticle((await params).slug);
  if (!article) return {};
  return pageMetadata({ title: article.title, description: article.description, path: `/help/${article.slug}`, ownImage: true });
}

function TopicNav({ current }: { current: string }) {
  return (
    <div className="space-y-6">
      {HELP_CATEGORIES.map((category) => (
        <div key={category.id}>
          <p className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{category.title}</p>
          <ul className="mt-1.5 space-y-0.5">
            {articlesIn(category.id).map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/help/${a.slug}`}
                  aria-current={a.slug === current ? "page" : undefined}
                  className={cn(
                    "flex min-h-9 items-center rounded-lg px-2 text-sm transition-colors",
                    a.slug === current ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default async function HelpArticlePage({ params }: PageProps<"/help/[slug]">) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  const category = helpCategory(article.category);
  const index = HELP_ARTICLES.indexOf(article);
  const prev = HELP_ARTICLES[index - 1];
  const next = HELP_ARTICLES[index + 1];

  const url = absoluteUrl(`/help/${article.slug}`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd,
      {
        "@type": "TechArticle",
        headline: article.title,
        description: article.description,
        url,
        mainEntityOfPage: url,
        dateModified: article.updated,
        inLanguage: "en-IN",
        articleSection: category.title,
        author: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        isPartOf: { "@id": WEBSITE_ID },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Help center", item: absoluteUrl("/help") },
          { "@type": "ListItem", position: 2, name: article.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articleJsonLd)} />

      <nav aria-label="Help topics" className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-6">
          <TopicNav current={article.slug} />
        </div>
      </nav>

      <article className="min-w-0 max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/help" className="hover:text-foreground">
                Help center
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li>{category.title}</li>
          </ol>
        </nav>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{article.title}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{article.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Updated <time dateTime={article.updated}>{formatDate(article.updated)}</time>
        </p>

        <details className="group mt-6 rounded-xl border bg-card lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
            All help topics
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <nav aria-label="Help topics" className="px-2 pt-1 pb-4">
            <TopicNav current={article.slug} />
          </nav>
        </details>

        <div className="doc-prose mt-8 border-t pt-8">
          <article.Body />
        </div>

        <nav aria-label="More help" className="mt-14 grid gap-3 border-t pt-8 sm:grid-cols-2">
          {prev ? (
            <Link href={`/help/${prev.slug}`} className="group rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChevronLeft className="size-3.5" aria-hidden />
                Previous
              </span>
              <span className="mt-1 block text-sm font-semibold">{prev.title}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {next && (
            <Link href={`/help/${next.slug}`} className="group rounded-2xl border bg-card p-4 text-right transition-colors hover:border-primary/40">
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                Next
                <ChevronRight className="size-3.5" aria-hidden />
              </span>
              <span className="mt-1 block text-sm font-semibold">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </div>
  );
}
