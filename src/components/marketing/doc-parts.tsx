import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NOTE_TONES = {
  info: { icon: Info, className: "border-info/25 bg-info/5 [&>svg]:text-info" },
  tip: { icon: Lightbulb, className: "border-primary/25 bg-accent/50 [&>svg]:text-primary" },
  warning: { icon: TriangleAlert, className: "border-warning/40 bg-warning/8 [&>svg]:text-warning-foreground dark:[&>svg]:text-warning" },
} as const;

/** A callout inside long-form text. */
export function Note({ tone = "info", title, children }: { tone?: keyof typeof NOTE_TONES; title?: string; children: React.ReactNode }) {
  const { icon: Icon, className } = NOTE_TONES[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border px-4 py-3.5 text-sm leading-6", className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        <div className="text-foreground/85">{children}</div>
      </div>
    </div>
  );
}

/** "Go here › then here" path through the app's menus. */
export function MenuPath({ children }: { children: React.ReactNode }) {
  return <strong className="whitespace-nowrap">{children}</strong>;
}

/** How to reach us: through the owner of the person's company account. */
export function ContactLine() {
  return <>ask the owner of your company&apos;s Kosh account, who can raise it with us</>;
}

/** Wide tables scroll sideways on phones instead of stretching the page. */
export function DocTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table>{children}</table>
    </div>
  );
}

export function HelpLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <Link href={`/help/${slug}`}>{children}</Link>;
}
