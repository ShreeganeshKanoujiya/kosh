import Link from "next/link";
import { FaqList } from "@/components/marketing/faq-list";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { jsonLd } from "@/config/site";
import { FAQ_GROUPS } from "@/content/faq";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description:
    "Answers about Kosh: setting up your company, the company code, scanning UPI screenshots, approvals, reports and exports, security and privacy.",
  path: "/faq",
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_GROUPS.flatMap((group) =>
    group.items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  ),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd)} />
      <PageIntro
        eyebrow="FAQ"
        title="Frequently asked questions"
        description="Quick answers about how Kosh works. For step-by-step guides, see the help center."
      >
        <nav aria-label="Topics" className="mt-6 flex flex-wrap gap-2">
          {FAQ_GROUPS.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="inline-flex min-h-9 items-center rounded-full border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {group.title}
            </a>
          ))}
        </nav>
      </PageIntro>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:px-6 md:py-16">
        {FAQ_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={group.id} className="scroll-mt-24">
            <h2 id={group.id} className="scroll-mt-24 text-xl font-semibold tracking-tight">
              {group.title}
            </h2>
            <FaqList items={group.items} className="mt-4" />
          </section>
        ))}

        <div className="rounded-2xl border bg-card p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold">Still have a question?</h2>
          <p className="mx-auto mt-2 max-w-md text-body text-muted-foreground">
            The help center walks through every part of Kosh, from setting up your company to exporting reports.
          </p>
          <Button asChild className="mt-5">
            <Link href="/help">Visit the help center</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
