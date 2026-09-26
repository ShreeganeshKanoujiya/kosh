import { apiRoute } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { exportToSheets } from "@/services/google-sheets.service";
import { listEntriesQuerySchema } from "@/validators/entry.schema";
import { exportDatasetQuerySchema } from "@/validators/export.schema";
import { reportQuerySchema } from "@/validators/report.schema";

/** `dataset` picks the screen; the rest of the query string is that screen's own filters. */
export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const { dataset } = parseQuery(req, exportDatasetQuerySchema);
  const request =
    dataset === "report"
      ? { source: dataset, query: parseQuery(req, reportQuerySchema) }
      : { source: dataset, query: parseQuery(req, listEntriesQuerySchema) };
  return ok(await exportToSheets(auth, request, getRequestMeta(req.headers)), { message: "Exported to Google Sheets" });
});
