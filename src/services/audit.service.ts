import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma, type DbClient } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import type { RequestMeta } from "@/lib/security/request-meta";
import { auditRepository } from "@/repositories/audit.repository";

export const AUDIT_ACTIONS = {
  companyCreated: "company.created",
  companyUpdated: "company.updated",
  settingsChanged: "settings.changed",

  login: "auth.login",
  logout: "auth.logout",
  logoutAll: "auth.logout_all",
  sessionRevoked: "auth.session_revoked",
  passwordChanged: "auth.password_changed",
  passwordResetRequested: "auth.password_reset_requested",
  passwordReset: "auth.password_reset",
  refreshTokenReuse: "auth.refresh_token_reuse",
  profileUpdated: "auth.profile_updated",

  userCreated: "user.created",
  userUpdated: "user.updated",
  userDisabled: "user.disabled",
  userEnabled: "user.enabled",
  userDeleted: "user.deleted",
  userRoleChanged: "user.role_changed",
  userPasswordReset: "user.password_reset",
  userSessionsRevoked: "user.sessions_revoked",

  roleCreated: "role.created",
  roleUpdated: "role.updated",
  roleDeleted: "role.deleted",

  transactionCreated: "transaction.created",
  transactionEdited: "transaction.edited",
  transactionSubmitted: "transaction.submitted",
  transactionVerified: "transaction.verified",
  transactionApproved: "transaction.approved",
  transactionRejected: "transaction.rejected",
  transactionCancelled: "transaction.cancelled",
  transactionDeleted: "transaction.deleted",

  categoryCreated: "category.created",
  categoryUpdated: "category.updated",
  categoryDeleted: "category.deleted",
  cashAccountCreated: "cash_account.created",
  cashAccountUpdated: "cash_account.updated",

  attachmentUploaded: "attachment.uploaded",
  attachmentDeleted: "attachment.deleted",
  reportExported: "report.exported",
  googleSheetsExported: "google_sheets.exported",
  googleSheetsSynced: "google_sheets.synced",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditEntry {
  companyId: string;
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  meta?: RequestMeta;
}

/** Write an audit entry. Throws — use inside the same DB transaction as the change it records. */
export function recordAudit(entry: AuditEntry, db: DbClient = prisma) {
  return auditRepository.create(
    {
      companyId: entry.companyId,
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      ipAddress: entry.meta?.ipAddress ?? null,
      userAgent: entry.meta?.userAgent ?? null,
    },
    db,
  );
}

/** For events outside a transaction (login, logout): never fail the user action because of the log. */
export async function recordAuditSafe(entry: AuditEntry) {
  try {
    await recordAudit(entry);
  } catch (error) {
    logger.error("Failed to write audit log", { action: entry.action, error });
  }
}
