import { apiRoute } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { auditQuerySchema, listAuditLogs } from "@/services/audit-query.service";

export const GET = apiRoute(async (req) => {
  const auth = await requireAuth();
  return ok(await listAuditLogs(auth, parseQuery(req, auditQuerySchema)));
});
