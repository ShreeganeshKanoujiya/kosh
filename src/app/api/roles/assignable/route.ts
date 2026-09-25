import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { listAssignableRoles } from "@/services/role.service";

export const GET = apiRoute(async () => {
  const auth = await requireAuth();
  return ok(await listAssignableRoles(auth));
});
