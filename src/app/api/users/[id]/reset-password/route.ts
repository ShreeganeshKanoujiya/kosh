import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { resetUserPassword } from "@/services/user.service";
import { adminResetPasswordSchema } from "@/validators/user.schema";

export const POST = apiRoute<RouteContext<"/api/users/[id]/reset-password">>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "USER_NOT_FOUND");
  const input = await parseBody(req, adminResetPasswordSchema);
  await resetUserPassword(auth, id, input, getRequestMeta(req.headers));
  return ok({ reset: true }, { message: "Password reset. The user has been signed out everywhere." });
});
