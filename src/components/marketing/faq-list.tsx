import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { Faq } from "@/content/faq";
import { cn } from "@/lib/utils";

/** Expandable questions. Native <details>, so answers are in the HTML and work without JavaScript. */
export function FaqList({ items, className }: { items: Faq[]; className?: string }) {
  return (
    <div className={cn("divide-y rounded-2xl border bg-card", className)}>
      {items.map((faq) => (
        <details key={faq.id} id={faq.id} className="group scroll-mt-24">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 px-5 py-4 text-left text-[0.9375rem] font-medium marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="flex-1">{faq.question}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="px-5 pb-5 text-body text-muted-foreground">
            <p>{faq.answer}</p>
            {faq.link && (
              <Link href={faq.link.href} className="mt-2 inline-block font-medium text-primary hover:underline">
                {faq.link.label} →
              </Link>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
