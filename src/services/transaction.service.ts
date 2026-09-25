import "server-only";
import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { EntryStatus } from "@/generated/prisma/enums";
import { Errors } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/session";
import { dateToYmd, todayYmd, ymdToDate } from "@/lib/dates";
import { prisma, type DbClient } from "@/lib/db/prisma";
import { balanceDelta, money } from "@/lib/money";
import type { RequestMeta } from "@/lib/security/request-meta";
import { cashAccountRepository } from "@/repositories/cash-account.repository";
import { categoryRepository } from "@/repositories/category.repository";
import { entryRepository, type EntryRow } from "@/repositories/entry.repository";
import { settingsRepository } from "@/repositories/settings.repository";
import type { AuthContext } from "@/types/auth";
import type { DuplicateCandidateDTO, EntryDTO, EntryListDTO } from "@/types/dto";
import type {
  createEntrySchema,
  ListEntriesQuery,
  rejectEntrySchema,
  updateEntrySchema,
} from "@/validators/entry.schema";
import { AUDIT_ACTIONS, recordAudit, type AuditAction } from "./audit.service";
import { allowedEntryActions, assertEntryAction } from "./entry-policy";
import { notifyEntryEvent } from "./notification.service";

type Settings = Awaited<ReturnType<typeof settingsRepository.get>>;
type EntryFieldsInput = z.output<typeof createEntrySchema> | z.output<typeof updateEntrySchema>;

const userRef = (u: { id: string; fullName: string; username: string } | null) =>
  u ? { id: u.id, fullName: u.fullName, username: u.username } : null;
const iso = (d: Date | null) => d?.toISOString() ?? null;

export function toEntryDTO(e: EntryRow, auth: AuthContext): EntryDTO {
  return {
    id: e.id,
    entryNumber: e.entryNumber,
    entryDate: dateToYmd(e.entryDate),
    entryTime: e.entryTime,
    type: e.type,
    amount: money(e.amount),
    currency: e.currency,
    category: e.category,
    description: e.description,
    paymentMethod: e.paymentMethod,
    merchantName: e.merchantName,
    upiId: e.upiId,
    transactionId: e.transactionId,
    referenceNumber: e.referenceNumber,
    source: e.source,
    status: e.status,
    rejectionReason: e.rejectionReason,
    autoApproved: e.autoApproved,
    cashAccount: e.cashAccount,
    createdBy: userRef(e.createdBy)!,
    verifiedBy: userRef(e.verifiedBy),
    approvedBy: userRef(e.approvedBy),
    rejectedBy: userRef(e.rejectedBy),
    submittedAt: iso(e.submittedAt),
    verifiedAt: iso(e.verifiedAt),
    approvedAt: iso(e.approvedAt),
    rejectedAt: iso(e.rejectedAt),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    version: e.version,
    attachmentCount: e._count.attachments,
    allowedActions: allowedEntryActions(auth, e),
  };
}

/** Snapshot used for audit old/new values. */
function auditSnapshot(e: Pick<EntryRow, "type" | "amount" | "entryDate" | "entryTime" | "categoryId" | "description" | "paymentMethod" | "merchantName" | "upiId" | "transactionId" | "referenceNumber" | "cashAccountId" | "status">) {
  return {
    type: e.type,
    amount: money(e.amount),
    entryDate: dateToYmd(e.entryDate),
    entryTime: e.entryTime,
    categoryId: e.categoryId,
    description: e.description,
    paymentMethod: e.paymentMethod,
    merchantName: e.merchantName,
    upiId: e.upiId,
    transactionId: e.transactionId,
    referenceNumber: e.referenceNumber,
    cashAccountId: e.cashAccountId,
    status: e.status,
  };
}

const versionConflict = () =>
  Errors.conflict("VERSION_CONFLICT", "This entry was changed by someone else. Reload to see the latest version.");

async function loadEntry(auth: AuthContext, id: string, db: DbClient = prisma) {
  const entry = await entryRepository.findById(auth.companyId, id, db);
  if (!entry) throw Errors.notFound("TRANSACTION_NOT_FOUND", "Transaction not found.");
  return entry;
}

/** Validate and normalise the editable fields against company settings and tenant data. */
async function resolveFields(
  auth: AuthContext,
  input: EntryFieldsInput,
  settings: Settings,
  existing?: EntryRow,
) {
  if (input.type === "adjustment") assertPermission(auth, "transactions.verify");

  const today = todayYmd(settings.timezone);
  if (input.entryDate > today) throw Errors.validation({ entryDate: ["Date can't be in the future"] });

  let amount = new Prisma.Decimal(input.amount);
  if (input.type === "adjustment" && input.adjustmentDirection === "decrease") amount = amount.negated();

  if (input.type === "expense" && settings.maxExpenseLimit && amount.greaterThan(settings.maxExpenseLimit)) {
    throw Errors.validation({
      amount: [`Exceeds the company's per-expense limit of ₹${settings.maxExpenseLimit.toFixed(2)}`],
    });
  }

  let categoryId: string | null = input.categoryId;
  if (categoryId) {
    const category = await categoryRepository.findById(auth.companyId, categoryId);
    // An inactive category may be kept on an existing entry, but not newly chosen.
    const keepsExisting = existing?.categoryId === categoryId;
    if (!category || (!category.isActive && !keepsExisting)) {
      throw Errors.validation({ categoryId: ["Choose an active category"] });
    }
  } else {
    categoryId = null;
  }

  const cashAccountId = input.cashAccountId ?? existing?.cashAccountId ?? settings.defaultCashAccountId;
  const account = cashAccountId ? await cashAccountRepository.findById(auth.companyId, cashAccountId) : null;
  if (!account || (!account.isActive && existing?.cashAccountId !== account.id)) {
    throw Errors.validation({ cashAccountId: ["Choose an active cash account"] });
  }

  return {
    type: input.type,
    amount,
    currency: account.currency,
    entryDate: ymdToDate(input.entryDate),
    entryTime: input.entryTime,
    categoryId,
    description: input.description,
    paymentMethod: input.paymentMethod,
    merchantName: input.merchantName,
    upiId: input.upiId,
    transactionId: input.transactionId,
    referenceNumber: input.referenceNumber,
    cashAccountId: account.id,
  };
}

function toDuplicateDTO(d: Awaited<ReturnType<typeof entryRepository.findDuplicates>>[number]): DuplicateCandidateDTO {
  return {
    id: d.id,
    entryNumber: d.entryNumber,
    entryDate: dateToYmd(d.entryDate),
    amount: money(d.amount),
    merchantName: d.merchantName,
    transactionId: d.transactionId,
    status: d.status,
  };
}

// ─── Submit / approval core (always inside a DB transaction) ───────────────

async function submitInTx(auth: AuthContext, entry: EntryRow, settings: Settings, meta: RequestMeta, tx: Prisma.TransactionClient) {
  assertEntryAction(auth, entry, "submit");
  if (settings.receiptRequired && entry.type === "expense" && entry._count.attachments === 0) {
    throw Errors.validation({ attachment: ["Attach a receipt before submitting"] }, "A receipt is required for expenses.");
  }

  const now = new Date();
  const clearRejection = { rejectionReason: null, rejectedAt: null, rejectedById: null };
  const base = { companyId: auth.companyId, userId: auth.userId, entityType: "transaction", entityId: entry.id, meta };

  if (!settings.approvalRequired) {
    const ok = await entryRepository.updateVersioned(
      auth.companyId,
      entry.id,
      { version: entry.version, statuses: ["draft", "rejected"] },
      { status: "approved", submittedAt: now, approvedAt: now, approvedById: auth.userId, autoApproved: true, ...clearRejection },
      tx,
    );
    if (!ok) throw versionConflict();
    await cashAccountRepository.applyDelta(auth.companyId, entry.cashAccountId, balanceDelta(entry.type, entry.amount), tx);
    await recordAudit({ ...base, action: AUDIT_ACTIONS.transactionSubmitted, newValues: { status: "submitted" } }, tx);
    await recordAudit({ ...base, action: AUDIT_ACTIONS.transactionApproved, newValues: { status: "approved", autoApproved: true } }, tx);
    return "approved" as const;
  }

  const ok = await entryRepository.updateVersioned(
    auth.companyId,
    entry.id,
    { version: entry.version, statuses: ["draft", "rejected"] },
    { status: "submitted", submittedAt: now, ...clearRejection },
    tx,
  );
  if (!ok) throw versionConflict();
  await recordAudit({ ...base, action: AUDIT_ACTIONS.transactionSubmitted, oldValues: { status: entry.status }, newValues: { status: "submitted" } }, tx);
  return "submitted" as const;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function listEntries(auth: AuthContext, query: ListEntriesQuery): Promise<EntryListDTO> {
  assertPermission(auth, "transactions.read");
  const { items, total, sums } = await entryRepository.list(auth.companyId, query);
  const sumOf = (type: string) => money(sums.find((s) => s.type === type)?._sum.amount ?? null);
  return {
    items: items.map((e) => toEntryDTO(e, auth)),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    summary: {
      count: total,
      expenseTotal: sumOf("expense"),
      incomeTotal: sumOf("income"),
      adjustmentTotal: sumOf("adjustment"),
    },
  };
}

export async function getEntry(auth: AuthContext, id: string): Promise<EntryDTO> {
  assertPermission(auth, "transactions.read");
  return toEntryDTO(await loadEntry(auth, id), auth);
}

// ─── Commands ───────────────────────────────────────────────────────────────

export async function createEntry(auth: AuthContext, input: z.output<typeof createEntrySchema>, meta: RequestMeta): Promise<EntryDTO> {
  assertPermission(auth, "transactions.create");
  const settings = await settingsRepository.get(auth.companyId);
  const fields = await resolveFields(auth, input, settings);

  if (!input.allowDuplicate) {
    const duplicates = await entryRepository.findDuplicates(auth.companyId, fields);
    if (duplicates.length) {
      throw Errors.conflict("POSSIBLE_DUPLICATE", "A similar transaction already exists.", {
        duplicates: duplicates.map(toDuplicateDTO),
      });
    }
  }

  const year = todayYmd(settings.timezone).slice(0, 4);
  let submittedAs: "submitted" | "approved" | null = null;

  const entryId = await prisma.$transaction(async (tx) => {
    const seq = await entryRepository.nextSequence(auth.companyId, `entry:${year}`, tx);
    const created = await entryRepository.create(
      {
        companyId: auth.companyId,
        createdById: auth.userId,
        entryNumber: `PC-${year}-${String(seq).padStart(6, "0")}`,
        source: input.source,
        status: "draft",
        ...fields,
      },
      tx,
    );
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.transactionCreated,
        entityType: "transaction",
        entityId: created.id,
        newValues: { entryNumber: created.entryNumber, ...auditSnapshot(created), duplicateConfirmed: input.allowDuplicate || undefined },
        meta,
      },
      tx,
    );
    if (input.submit) submittedAs = await submitInTx(auth, created, settings, meta, tx);
    return created.id;
  });

  const entry = await loadEntry(auth, entryId);
  if (submittedAs) await notifyEntryEvent(auth, entry, submittedAs === "approved" ? "auto_approved" : "submitted");
  return toEntryDTO(entry, auth);
}

export async function updateEntry(auth: AuthContext, id: string, input: z.output<typeof updateEntrySchema>, meta: RequestMeta): Promise<EntryDTO> {
  const entry = await loadEntry(auth, id);
  assertEntryAction(auth, entry, "edit");
  if (entry.version !== input.version) throw versionConflict();

  const settings = await settingsRepository.get(auth.companyId);
  const fields = await resolveFields(auth, input, settings, entry);

  await prisma.$transaction(async (tx) => {
    const ok = await entryRepository.updateVersioned(
      auth.companyId,
      id,
      { version: input.version, statuses: [entry.status] },
      fields,
      tx,
    );
    if (!ok) throw versionConflict();
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.transactionEdited,
        entityType: "transaction",
        entityId: id,
        oldValues: auditSnapshot(entry),
        newValues: auditSnapshot({ ...entry, ...fields }),
        meta,
      },
      tx,
    );
  });
  return toEntryDTO(await loadEntry(auth, id), auth);
}

export async function submitEntry(auth: AuthContext, id: string, version: number, meta: RequestMeta) {
  const settings = await settingsRepository.get(auth.companyId);
  const status = await prisma.$transaction(async (tx) => {
    const entry = await loadEntry(auth, id, tx);
    if (entry.version !== version) throw versionConflict();
    return submitInTx(auth, entry, settings, meta, tx);
  });
  const entry = await loadEntry(auth, id);
  await notifyEntryEvent(auth, entry, status === "approved" ? "auto_approved" : "submitted");
  return toEntryDTO(entry, auth);
}

/** Shared shape for review transitions (verify / approve / reject / cancel / delete). */
async function transition(
  auth: AuthContext,
  id: string,
  version: number,
  action: "verify" | "approve" | "reject" | "cancel" | "delete",
  build: (entry: EntryRow, now: Date) => {
    data: Prisma.PettyCashEntryUncheckedUpdateManyInput;
    audit: { action: AuditAction; newValues?: Prisma.InputJsonValue };
    after?: (entry: EntryRow, tx: Prisma.TransactionClient) => Promise<unknown>;
  },
  meta: RequestMeta,
) {
  const entry = await prisma.$transaction(async (tx) => {
    const current = await loadEntry(auth, id, tx);
    assertEntryAction(auth, current, action);
    if (current.version !== version) throw versionConflict();

    const { data, audit, after } = build(current, new Date());
    const ok = await entryRepository.updateVersioned(
      auth.companyId,
      id,
      { version, statuses: [current.status as EntryStatus] },
      data,
      tx,
    );
    if (!ok) throw versionConflict();
    if (after) await after(current, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: audit.action,
        entityType: "transaction",
        entityId: id,
        oldValues: { status: current.status },
        newValues: audit.newValues,
        meta,
      },
      tx,
    );
    return current;
  });
  return entry;
}

export async function verifyEntry(auth: AuthContext, id: string, version: number, meta: RequestMeta) {
  await transition(
    auth,
    id,
    version,
    "verify",
    (_e, now) => ({
      data: { status: "pending_approval", verifiedAt: now, verifiedById: auth.userId },
      audit: { action: AUDIT_ACTIONS.transactionVerified, newValues: { status: "pending_approval" } },
    }),
    meta,
  );
  const entry = await loadEntry(auth, id);
  await notifyEntryEvent(auth, entry, "verified");
  return toEntryDTO(entry, auth);
}

export async function approveEntry(auth: AuthContext, id: string, version: number, meta: RequestMeta) {
  await transition(
    auth,
    id,
    version,
    "approve",
    (_e, now) => ({
      data: { status: "approved", approvedAt: now, approvedById: auth.userId },
      audit: { action: AUDIT_ACTIONS.transactionApproved, newValues: { status: "approved" } },
      // Balance moves in the same DB transaction as the status change — exactly once.
      after: (e, tx) => cashAccountRepository.applyDelta(auth.companyId, e.cashAccountId, balanceDelta(e.type, e.amount), tx),
    }),
    meta,
  );
  const entry = await loadEntry(auth, id);
  await notifyEntryEvent(auth, entry, "approved");
  return toEntryDTO(entry, auth);
}

export async function rejectEntry(auth: AuthContext, id: string, input: z.output<typeof rejectEntrySchema>, meta: RequestMeta) {
  await transition(
    auth,
    id,
    input.version,
    "reject",
    (_e, now) => ({
      data: { status: "rejected", rejectedAt: now, rejectedById: auth.userId, rejectionReason: input.reason },
      audit: { action: AUDIT_ACTIONS.transactionRejected, newValues: { status: "rejected", reason: input.reason } },
    }),
    meta,
  );
  const entry = await loadEntry(auth, id);
  await notifyEntryEvent(auth, entry, "rejected");
  return toEntryDTO(entry, auth);
}

export async function cancelEntry(auth: AuthContext, id: string, version: number, meta: RequestMeta) {
  await transition(
    auth,
    id,
    version,
    "cancel",
    () => ({ data: { status: "cancelled" }, audit: { action: AUDIT_ACTIONS.transactionCancelled, newValues: { status: "cancelled" } } }),
    meta,
  );
  return toEntryDTO(await loadEntry(auth, id), auth);
}

export async function deleteEntry(auth: AuthContext, id: string, version: number, meta: RequestMeta) {
  const entry = await transition(
    auth,
    id,
    version,
    "delete",
    (_e, now) => ({
      data: { deletedAt: now, deletedById: auth.userId },
      audit: { action: AUDIT_ACTIONS.transactionDeleted, newValues: { deleted: true } },
    }),
    meta,
  );
  return { id: entry.id, entryNumber: entry.entryNumber };
}

