import { apiRoute } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/parse";
import { file } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { exportReport } from "@/services/export.service";
import { exportFormatQuerySchema } from "@/validators/export.schema";
import { reportQuerySchema } from "@/validators/report.schema";

/** Same query string as GET /api/reports plus `format`, so the file is exactly what's on screen. POST: it's audited. */
export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const { format } = parseQuery(req, exportFormatQuerySchema);
  return file(await exportReport(auth, parseQuery(req, reportQuerySchema), format, getRequestMeta(req.headers)));
});
