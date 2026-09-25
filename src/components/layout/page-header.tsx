import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        {back && (
          <Link
            href={back.href}
            className="-ml-1 mb-1 inline-flex min-h-9 items-center gap-0.5 text-sm font-medium text-primary hover:underline"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1 className="text-page-title">{title}</h1>
        {description && <p className="text-caption text-[0.9375rem]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
