import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/session";
import { listPermissionCatalog } from "@/services/role.service";

export const GET = apiRoute(async () => {
  await requirePermission("roles.read");
  return ok(listPermissionCatalog());
});
