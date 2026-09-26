import { apiRoute } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/parse";
import { file } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { exportTransactions } from "@/services/export.service";
import { listEntriesQuerySchema } from "@/validators/entry.schema";
import { exportFormatQuerySchema } from "@/validators/export.schema";

/** Same filters as GET /api/transactions plus `format`; every matching entry, not just one page. */
export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const { format } = parseQuery(req, exportFormatQuerySchema);
  return file(await exportTransactions(auth, parseQuery(req, listEntriesQuerySchema), format, getRequestMeta(req.headers)));
});
