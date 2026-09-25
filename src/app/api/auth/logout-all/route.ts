import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { logoutAll } from "@/services/auth.service";

export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const count = await logoutAll(auth, getRequestMeta(req.headers));
  const res = ok({ sessionsRevoked: count }, { message: "Logged out from all devices" });
  clearAuthCookies(res.cookies);
  return res;
});
