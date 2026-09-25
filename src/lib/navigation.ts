/** Only allow same-site relative redirect targets (prevents open redirects via ?next=). */
export function safeNextPath(value: string | string[] | undefined | null, fallback = "/dashboard"): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.startsWith("/login") || next.startsWith("/register") || next.startsWith("/api/")) return fallback;
  return next;
}
