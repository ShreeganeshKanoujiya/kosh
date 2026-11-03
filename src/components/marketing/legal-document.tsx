import { ChevronDown } from "lucide-react";
import { Fragment } from "react";
import { SITE } from "@/config/site";
import { formatDate } from "@/lib/format";
import { PageIntro } from "./page-intro";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

function Contents({ sections }: { sections: LegalSection[] }) {
  return (
    <ol className="space-y-1 text-sm">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="flex gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <span className="w-5 shrink-0 tabular-nums">{i + 1}.</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Privacy policy / terms layout: title band, numbered sections and a table of contents. */
export function LegalDocument({ title, intro, sections }: { title: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <>
      <PageIntro eyebrow="Legal" title={title}>
        <p className="mt-3 text-sm text-muted-foreground">Last updated {formatDate(SITE.legalUpdated)}</p>
      </PageIntro>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <nav aria-label="Contents" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto">
            <p className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contents</p>
            <div className="mt-2">
              <Contents sections={sections} />
            </div>
          </div>
        </nav>

        <div className="min-w-0 max-w-3xl">
          <details className="group mb-8 rounded-xl border bg-card lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Contents
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <nav aria-label="Contents" className="px-2 pb-3">
              <Contents sections={sections} />
            </nav>
          </details>

          <div className="doc-prose">
            <div className="text-base leading-7">{intro}</div>
            {/* Fragments, not wrappers: the prose spacing rules apply to direct children. */}
            {sections.map((s, i) => (
              <Fragment key={s.id}>
                <h2 id={s.id}>
                  {i + 1}. {s.title}
                </h2>
                {s.body}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
