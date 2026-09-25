import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { deleteRole, updateRole } from "@/services/role.service";
import { updateRoleSchema } from "@/validators/role.schema";

type Ctx = RouteContext<"/api/roles/[id]">;

export const PATCH = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "ROLE_NOT_FOUND");
  const input = await parseBody(req, updateRoleSchema);
  return ok(await updateRole(auth, id, input, getRequestMeta(req.headers)), { message: "Role updated" });
});

export const DELETE = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "ROLE_NOT_FOUND");
  await deleteRole(auth, id, getRequestMeta(req.headers));
  return ok({ deleted: true }, { message: "Role deleted" });
});
