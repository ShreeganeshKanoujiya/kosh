import Image from "next/image";
import { cn } from "@/lib/utils";

// Where the letters sit inside public/kosh.png (1254×1254, transparent). Re-measure if the image changes.
const WORDMARK = { size: 1254, left: 162, top: 465, width: 939, height: 310 };

/** The white Kosh wordmark from public/kosh.png, cropped to the letters. For dark surfaces only; size it by width. */
export function KoshWordmark({ className }: { className?: string }) {
  const { size, left, top, width, height } = WORDMARK;
  return (
    <span className={cn("relative block overflow-hidden", className)} style={{ aspectRatio: `${width} / ${height}` }}>
      <Image
        src="/kosh.png"
        alt="Kosh"
        width={size}
        height={size}
        loading="eager"
        sizes="240px"
        className="absolute max-w-none"
        style={{ width: `${(size / width) * 100}%`, height: "auto", left: `${(-left / width) * 100}%`, top: `${(-top / height) * 100}%` }}
      />
    </span>
  );
}

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
