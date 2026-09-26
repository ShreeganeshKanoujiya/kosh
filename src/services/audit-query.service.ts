import "server-only";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/session";
import { addDays, ymdToDate } from "@/lib/dates";
import { auditQueryRepository } from "@/repositories/audit-query.repository";
import type { Paginated } from "@/types/api";
import type { AuthContext } from "@/types/auth";
import type { AuditLogDTO } from "@/types/dto";
import { idSchema, paginationSchema } from "@/validators/common";
import { ymdSchema } from "@/validators/entry.schema";

export const auditQuerySchema = paginationSchema.extend({
  entityType: z.enum(["transaction", "user", "role", "category", "cash_account", "company", "company_settings", "session", "report"]).optional(),
  entityId: z.string().max(64).optional(),
  userId: idSchema.optional(),
  action: z.string().regex(/^[a-z_.]+$/).max(64).optional(),
  from: ymdSchema.optional(),
  to: ymdSchema.optional(),
});

/** Read-only view of the append-only audit trail (audit_logs.read). */
export async function listAuditLogs(auth: AuthContext, q: z.output<typeof auditQuerySchema>): Promise<Paginated<AuditLogDTO>> {
  assertPermission(auth, "audit_logs.read");
  const { items, total, users } = await auditQueryRepository.list(auth.companyId, {
    ...q,
    from: q.from ? ymdToDate(q.from) : undefined,
    to: q.to ? ymdToDate(addDays(q.to, 1)) : undefined,
  });
  return {
    items: items.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      user: a.userId ? (users.get(a.userId) ?? null) : null,
      oldValues: a.oldValues,
      newValues: a.newValues,
      ipAddress: a.ipAddress,
      userAgent: a.userAgent,
      createdAt: a.createdAt.toISOString(),
    })),
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

/** Timeline for one transaction — visible to anyone who can read the transaction. */
export async function entryHistory(auth: AuthContext, entryId: string): Promise<AuditLogDTO[]> {
  assertPermission(auth, "transactions.read");
  const { items, users } = await auditQueryRepository.list(auth.companyId, {
    page: 1,
    pageSize: 50,
    entityType: "transaction",
    entityId: entryId,
  });
  return items.map((a) => ({
    id: a.id,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    user: a.userId ? (users.get(a.userId) ?? null) : null,
    oldValues: a.oldValues,
    newValues: a.newValues,
    ipAddress: null,
    userAgent: null,
    createdAt: a.createdAt.toISOString(),
  }));
}
