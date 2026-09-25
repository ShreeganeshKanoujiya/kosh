import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { deleteUser, getUser, updateUser } from "@/services/user.service";
import { updateUserSchema } from "@/validators/user.schema";

type Ctx = RouteContext<"/api/users/[id]">;

export const GET = apiRoute<Ctx>(async (_req, ctx) => {
  const auth = await requireAuth();
  return ok(await getUser(auth, parseId((await ctx.params).id, "USER_NOT_FOUND")));
});

export const PATCH = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "USER_NOT_FOUND");
  const input = await parseBody(req, updateUserSchema);
  return ok(await updateUser(auth, id, input, getRequestMeta(req.headers)), { message: "User updated" });
});

export const DELETE = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "USER_NOT_FOUND");
  await deleteUser(auth, id, getRequestMeta(req.headers));
  return ok({ deleted: true }, { message: "User deleted" });
});
