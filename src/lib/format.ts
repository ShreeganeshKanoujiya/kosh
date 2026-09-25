import { format, formatDistanceToNowStrict, isToday, isYesterday, parseISO } from "date-fns";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

/** ₹18,450.00 — Indian digit grouping for INR. */
export function formatCurrency(value: number | string, currency = "INR", options?: { compact?: boolean; decimals?: boolean }) {
  const amount = typeof value === "string" ? Number(value) : value;
  const key = `${currency}:${options?.compact ? "c" : ""}:${options?.decimals === false ? "0" : "2"}`;
  let fmt = currencyFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en", {
      style: "currency",
      currency,
      notation: options?.compact ? "compact" : "standard",
      minimumFractionDigits: options?.decimals === false || options?.compact ? 0 : 2,
      maximumFractionDigits: options?.decimals === false ? 0 : 2,
    });
    currencyFormatters.set(key, fmt);
  }
  return fmt.format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

const toDate = (value: string | Date) => (typeof value === "string" ? parseISO(value) : value);

/** 25 Sep 2026 */
export function formatDate(value: string | Date) {
  return format(toDate(value), "d MMM yyyy");
}

/** 25 Sep 2026, 10:42 AM */
export function formatDateTime(value: string | Date) {
  return format(toDate(value), "d MMM yyyy, h:mm a");
}

/** Today, 10:42 AM · Yesterday · 25 Sep */
export function formatRelativeDay(value: string | Date) {
  const d = toDate(value);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
  return format(d, "d MMM yyyy");
}

export function formatTimeAgo(value: string | Date) {
  return formatDistanceToNowStrict(toDate(value), { addSuffix: true });
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

/** "Chrome on Windows" from a user-agent string — good enough for a sessions list. */
export function describeUserAgent(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : null;
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? ua.slice(0, 40);
}

export function isMobileUserAgent(ua: string | null) {
  return Boolean(ua && /iPhone|iPad|iPod|Android|Mobile/.test(ua));
}
