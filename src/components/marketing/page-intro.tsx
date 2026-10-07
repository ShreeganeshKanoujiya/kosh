import { cn } from "@/lib/utils";

/** Title band at the top of the FAQ, help and legal pages. */
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b bg-card", className)}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>}
        {children}
      </div>
    </div>
  );
}
