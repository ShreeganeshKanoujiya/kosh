import { ArrowRight, CircleHelp } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { HELP_CATEGORIES, articlesIn, getHelpArticle } from "@/content/help";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Help center",
  description:
    "Step-by-step guides for Kosh: set up your company, record and scan expenses, approve entries, run reports, and manage users, roles and settings.",
  path: "/help",
});

const POPULAR = ["getting-started", "scan-upi-screenshots", "approval-workflow", "users-and-roles"];

export default function HelpCenterPage() {
  return (
    <>
      <PageIntro
        eyebrow="Help center"
        title="How can we help?"
        description="Guides for everyone who uses Kosh, from the person holding the cash box to the owner signing off the books."
      >
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR.map((slug) => {
            const article = getHelpArticle(slug)!;
            return (
              <li key={slug}>
                <Link
                  href={`/help/${slug}`}
                  className="group flex h-full flex-col rounded-2xl border bg-background p-4 transition-colors hover:border-primary/40"
                >
                  <span className="text-sm font-semibold">{article.title}</span>
                  <span className="mt-1 line-clamp-2 text-caption">{article.description}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <h2 className="sr-only">All topics</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {HELP_CATEGORIES.map(({ id, title, description, icon: Icon }) => (
            <section key={id} aria-labelledby={`cat-${id}`} className="rounded-2xl border bg-card p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 id={`cat-${id}`} className="mt-4 text-base font-semibold">
                {title}
              </h3>
              <p className="mt-1 text-caption">{description}</p>
              <ul className="mt-4 space-y-0.5">
                {articlesIn(id).map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/help/${article.slug}`}
                      className="-mx-2 flex min-h-10 items-center rounded-lg px-2 text-sm font-medium text-primary hover:bg-muted"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
          <CircleHelp className="size-8 shrink-0 text-primary" aria-hidden />
          <div className="flex-1">
            <h2 className="font-semibold">Looking for a quick answer?</h2>
            <p className="text-caption">Short answers to the questions people ask most often.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/faq">Read the FAQ</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
