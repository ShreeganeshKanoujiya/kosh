import { apiRoute } from "@/lib/api/handler";
import { parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { revokeUserSessions } from "@/services/user.service";

export const POST = apiRoute<RouteContext<"/api/users/[id]/revoke-sessions">>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "USER_NOT_FOUND");
  const count = await revokeUserSessions(auth, id, getRequestMeta(req.headers));
  return ok({ sessionsRevoked: count }, { message: count ? `Signed out of ${count} session${count === 1 ? "" : "s"}` : "No active sessions" });
});
