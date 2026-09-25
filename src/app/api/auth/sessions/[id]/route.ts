import { apiRoute } from "@/lib/api/handler";
import { parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { revokeMySession } from "@/services/session.service";

export const DELETE = apiRoute<RouteContext<"/api/auth/sessions/[id]">>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "SESSION_NOT_FOUND");
  const { current } = await revokeMySession(auth, id, getRequestMeta(req.headers));
  const res = ok({ revoked: true, current }, { message: "Session signed out" });
  if (current) clearAuthCookies(res.cookies);
  return res;
});
