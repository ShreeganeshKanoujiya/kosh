import { AUTH_COOKIES } from "@/config/auth";
import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { getRequestMeta } from "@/lib/security/request-meta";
import { revokeSessionByRefreshToken } from "@/services/session.service";

/** Log out this device: revoke the session (token family) and clear cookies. Idempotent. */
export const POST = apiRoute(async (req) => {
  await revokeSessionByRefreshToken(req.cookies.get(AUTH_COOKIES.refresh)?.value, getRequestMeta(req.headers));
  const res = ok({ loggedOut: true }, { message: "Logged out" });
  clearAuthCookies(res.cookies);
  return res;
});
