import "server-only";
import { randomInt } from "node:crypto";
import type { z } from "zod";
import { AppError, Errors, isAppError } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { GoogleApiError, parseSpreadsheetId, serviceAccount, sheetsApi, spreadsheetUrl, type ServiceAccount } from "@/lib/google-sheets/client";
import { buildSheetBatches } from "@/lib/google-sheets/requests";
import { logger } from "@/lib/logger";
import type { RequestMeta } from "@/lib/security/request-meta";
import { settingsRepository } from "@/repositories/settings.repository";
import type { AuthContext } from "@/types/auth";
import type { SheetsConnectionDTO, SheetsExportDTO } from "@/types/dto";
import type { ListEntriesQuery } from "@/validators/entry.schema";
import type { connectSheetSchema } from "@/validators/export.schema";
import type { ReportQuery } from "@/validators/report.schema";
import { AUDIT_ACTIONS, recordAudit } from "./audit.service";
import { buildTransactionsTable, exportMeta, limitExports, recordExport } from "./export.service";
import { notify } from "./notification.service";
import { buildReport } from "./report.service";

// Google Sheets is an export target only — PostgreSQL stays the source of truth.
// A company connects one spreadsheet (shared with our service account); every export
// becomes a new, timestamped tab in it.

export const sheetsConfigured = () => serviceAccount() !== null;

/** Show "Export to Google Sheets" only when it can actually work for this user. */
export function sheetsExportAvailable(auth: AuthContext, settings: { googleSheetId: string | null }) {
  return auth.permissions.has("google_sheets.export") && Boolean(settings.googleSheetId) && sheetsConfigured();
}

function connectionDTO(spreadsheetId: string | null): SheetsConnectionDTO {
  const sa = serviceAccount();
  return {
    configured: sa !== null,
    serviceAccountEmail: sa?.email ?? null,
    spreadsheetId,
    spreadsheetUrl: spreadsheetId ? spreadsheetUrl(spreadsheetId) : null,
  };
}

function requireServiceAccount(): ServiceAccount {
  const sa = serviceAccount();
  if (!sa) throw Errors.badRequest("SHEETS_NOT_CONFIGURED", "Google Sheets export isn't set up on this server.");
  return sa;
}

/** Translate a Google failure into something the user can act on. */
function sheetsError(error: unknown, sa: ServiceAccount): unknown {
  if (!(error instanceof GoogleApiError)) return error;
  if (error.status === 403 || error.status === 404) {
    return Errors.badRequest("SHEET_NOT_ACCESSIBLE", `Kosh can't open this sheet. Share it with ${sa.email} as an Editor, then try again.`);
  }
  if (error.status === 429) return Errors.rateLimited(60, "Google Sheets is busy right now. Please try again in a minute.");
  logger.error("Google Sheets API call failed", { status: error.status, error });
  if (error.status === 401) {
    return new AppError("SHEETS_MISCONFIGURED", "Google Sheets isn't configured correctly on the server. Ask your administrator to check the service account.", 503);
  }
  return new AppError("SHEETS_UNAVAILABLE", "Google Sheets didn't respond. Please try again.", 502);
}

export async function getSheetsConnection(auth: AuthContext): Promise<SheetsConnectionDTO> {
  if (!auth.permissions.has("settings.read") && !auth.permissions.has("company.read")) throw Errors.forbidden();
  const settings = await settingsRepository.get(auth.companyId);
  return connectionDTO(settings.googleSheetId);
}

async function saveSpreadsheetId(auth: AuthContext, spreadsheetId: string | null, meta: RequestMeta) {
  const before = await settingsRepository.get(auth.companyId);
  await prisma.$transaction(async (tx) => {
    await settingsRepository.update(auth.companyId, { googleSheetId: spreadsheetId }, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.settingsChanged,
        entityType: "company_settings",
        entityId: auth.companyId,
        oldValues: { googleSheetId: before.googleSheetId },
        newValues: { googleSheetId: spreadsheetId },
        meta,
      },
      tx,
    );
  });
}

/** Verify we can open the sheet before saving it, so a bad link fails here and not at export time. */
export async function connectSheet(auth: AuthContext, input: z.output<typeof connectSheetSchema>, meta: RequestMeta) {
  assertPermission(auth, "settings.update");
  const sa = requireServiceAccount();
  const spreadsheetId = parseSpreadsheetId(input.url);
  if (!spreadsheetId) throw Errors.validation({ url: ["That doesn't look like a Google Sheets link"] });

  let title: string;
  try {
    title = (await sheetsApi.getSpreadsheet(sa, spreadsheetId)).properties.title;
  } catch (error) {
    const appError = sheetsError(error, sa);
    if (isAppError(appError) && appError.code === "SHEET_NOT_ACCESSIBLE") {
      throw Errors.validation({ url: [appError.message] }, appError.message);
    }
    throw appError;
  }

  await saveSpreadsheetId(auth, spreadsheetId, meta);
  return { connection: connectionDTO(spreadsheetId), title };
}

export async function disconnectSheet(auth: AuthContext, meta: RequestMeta): Promise<SheetsConnectionDTO> {
  assertPermission(auth, "settings.update");
  await saveSpreadsheetId(auth, null, meta);
  return connectionDTO(null);
}

export type SheetsExportRequest = { source: "report"; query: ReportQuery } | { source: "transactions"; query: ListEntriesQuery };

/** Write exactly the filtered table the user is looking at into a new tab of the company's sheet. */
export async function exportToSheets(auth: AuthContext, request: SheetsExportRequest, meta: RequestMeta): Promise<SheetsExportDTO> {
  assertPermission(auth, "google_sheets.export");
  const sa = requireServiceAccount();
  const settings = await settingsRepository.get(auth.companyId);
  const spreadsheetId = settings.googleSheetId;
  if (!spreadsheetId) throw Errors.badRequest("SHEET_NOT_CONNECTED", "Connect a Google Sheet first in Settings → Company.");
  await limitExports(auth);

  const table =
    request.source === "report" ? await buildReport(auth, request.query) : await buildTransactionsTable(auth, request.query, settings.currency);

  const stamp = new Intl.DateTimeFormat("en-GB", {
    timeZone: settings.timezone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const tabTitle = `${table.title} · ${stamp}`.slice(0, 100);
  const sheetId = randomInt(1, 2_000_000_000);
  const batches = buildSheetBatches(table, exportMeta(auth, settings.timezone), sheetId, tabTitle);

  let written = 0;
  try {
    for (const requests of batches) {
      await sheetsApi.batchUpdate(sa, spreadsheetId, requests);
      written++;
    }
  } catch (error) {
    // The first batch is atomic; if a later chunk fails, remove the half-written tab.
    if (written > 0) await sheetsApi.batchUpdate(sa, spreadsheetId, [{ deleteSheet: { sheetId } }]).catch(() => undefined);
    throw sheetsError(error, sa);
  }

  await recordExport(
    auth,
    AUDIT_ACTIONS.googleSheetsExported,
    { source: request.source, format: "google_sheets", table, extra: { spreadsheetId, tab: tabTitle } },
    meta,
  );
  await notify(auth.companyId, [auth.userId], {
    type: "export.completed",
    title: "Google Sheets export completed",
    body: `${table.title} → “${tabTitle}”`,
  });
  return { url: spreadsheetUrl(spreadsheetId, sheetId), sheetTitle: tabTitle, rows: table.rows.length };
}
