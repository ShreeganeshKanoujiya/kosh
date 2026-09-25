export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Client IP and user agent for audit/session records and rate limiting.
 * Assumes the app runs behind a trusted proxy (Vercel, a load balancer) that
 * overwrites X-Forwarded-For; the left-most entry is the original client.
 */
export function getRequestMeta(headers: Headers): RequestMeta {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || null;
  const userAgent = headers.get("user-agent");
  return {
    ipAddress: ip ? ip.slice(0, 64) : null,
    userAgent: userAgent ? userAgent.slice(0, 512) : null,
  };
}
