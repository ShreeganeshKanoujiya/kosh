import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function allowedOrigins(req: NextRequest): Set<string> {
  const origins = new Set<string>([req.nextUrl.origin]);
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      // ignore malformed APP_URL here; env validation reports it
    }
  }
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
    origins.add(`${proto}://${forwardedHost}`);
  }
  return origins;
}

/**
 * CSRF defence for cookie-authenticated, state-changing requests.
 * Layered on top of SameSite=Lax cookies: the request must come from our own origin.
 */
export function assertSameOrigin(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return;

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new AppError("CSRF_REJECTED", "Cross-site request blocked.", 403);
  }

  const origin = req.headers.get("origin");
  if (!origin || !allowedOrigins(req).has(origin)) {
    throw new AppError("CSRF_REJECTED", "Cross-site request blocked.", 403);
  }
}
