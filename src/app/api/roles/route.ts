import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { created, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { createRole, listRoles } from "@/services/role.service";
import { createRoleSchema } from "@/validators/role.schema";

export const GET = apiRoute(async () => {
  const auth = await requireAuth();
  return ok(await listRoles(auth));
});

export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, createRoleSchema);
  return created(await createRole(auth, input, getRequestMeta(req.headers)), "Role created");
});
