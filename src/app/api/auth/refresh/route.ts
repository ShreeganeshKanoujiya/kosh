import { AUTH_COOKIES, RATE_LIMITS } from "@/config/auth";
import { AppError } from "@/lib/api/errors";
import { apiRoute } from "@/lib/api/handler";
import { fail, ok } from "@/lib/api/response";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getRequestMeta } from "@/lib/security/request-meta";
import { rotateRefreshToken } from "@/services/session.service";

/** Explicit refresh for API clients. Page and API navigations are refreshed transparently by src/proxy.ts. */
export const POST = apiRoute(async (req) => {
  const meta = getRequestMeta(req.headers);
  await enforceRateLimit(`refresh:ip:${meta.ipAddress ?? "unknown"}`, RATE_LIMITS.refreshPerIp);

  const outcome = await rotateRefreshToken(req.cookies.get(AUTH_COOKIES.refresh)?.value, meta);
  if (!outcome.ok) {
    const res = fail(
      new AppError(
        outcome.reason === "reused" ? "SESSION_REVOKED" : "SESSION_EXPIRED",
        "Your session has ended. Please log in again.",
        401,
      ),
    );
    clearAuthCookies(res.cookies);
    return res;
  }

  const res = ok({ refreshed: true });
  setAuthCookies(res.cookies, outcome.tokens);
  return res;
});
