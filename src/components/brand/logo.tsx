import { cn } from "@/lib/utils";

/** Kosh mark: a coin slot in a rounded square — reads well at 16px. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        <rect x="4" y="7" width="16" height="12" rx="3" />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
        <path d="M9.5 13h5" />
      </svg>
    </span>
  );
}

export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showName && <span className="text-[1.0625rem] font-semibold tracking-tight">Kosh</span>}
    </span>
  );
}
