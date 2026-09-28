import "server-only";
import { createHash } from "node:crypto";
import type { z } from "zod";
import { ATTACHMENT_KIND_LABELS, ATTACHMENTS_PER_ENTRY, IMAGE_TYPES, type AttachmentKindValue, type AttachmentMimeType } from "@/config/attachments";
import { AppError, Errors } from "@/lib/api/errors";
import type { Upload } from "@/lib/api/parse";
import { assertPermission } from "@/lib/auth/session";
import { prisma, type DbClient } from "@/lib/db/prisma";
import { cleanFileName, extensionMatches, sniffFileType } from "@/lib/files/sniff";
import { logger } from "@/lib/logger";
import type { RequestMeta } from "@/lib/security/request-meta";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { newStorageKey, objectStorage, type ObjectStorage } from "@/lib/storage";
import { attachmentRepository, type AttachmentRow } from "@/repositories/attachment.repository";
import { entryRepository } from "@/repositories/entry.repository";
import type { AuthContext } from "@/types/auth";
import type { AttachmentDTO } from "@/types/dto";
import type { uploadAttachmentSchema } from "@/validators/attachment.schema";
import { AUDIT_ACTIONS, recordAudit } from "./audit.service";
import { assertEntryAction } from "./entry-policy";

/** Unlinked uploads (abandoned forms and scans) are removed after this long. */
const ORPHAN_TTL_MS = 24 * 60 * 60 * 1000;

export function toAttachmentDTO(a: AttachmentRow): AttachmentDTO {
  return {
    id: a.id,
    kind: a.kind,
    fileName: a.fileName,
    fileType: a.fileType,
    fileSize: a.fileSize,
    isImage: (IMAGE_TYPES as readonly string[]).includes(a.fileType),
    url: `/api/attachments/${a.id}/file`,
    uploadedBy: a.uploadedBy,
    createdAt: a.createdAt.toISOString(),
  };
}

function requireStorage(): ObjectStorage {
  const storage = objectStorage();
  if (!storage) throw new AppError("UPLOADS_NOT_CONFIGURED", "File uploads aren't set up on this server yet. Ask your administrator.", 503);
  return storage;
}

export function limitUploads(auth: AuthContext) {
  return enforceRateLimit(`upload:${auth.userId}`, { limit: 60, windowSeconds: 600 }, "Too many uploads in a short time. Please wait a little and try again.");
}

/**
 * Validate the bytes, store them under a random key, and record the row. The stored type
 * is the one detected from the content; a file whose extension disagrees is refused.
 */
export async function storeUpload(
  auth: AuthContext,
  upload: Upload,
  kind: AttachmentKindValue,
  entryId: string | null,
  /** Runs in the same DB transaction as the insert — for the audit entry. */
  afterCreate: (row: AttachmentRow, tx: DbClient) => Promise<unknown>,
): Promise<{ row: AttachmentRow; sha256: string; type: AttachmentMimeType }> {
  const storage = requireStorage();
  const type = sniffFileType(upload.bytes);
  if (!type) throw Errors.validation({ file: ["Upload a JPG, PNG, WebP or PDF file"] }, "That file type isn't supported.");
  if (!extensionMatches(upload.name, type)) {
    throw Errors.validation({ file: ["The file's contents don't match its name"] }, "That file type isn't supported.");
  }
  if (kind === "upi_screenshot" && !IMAGE_TYPES.includes(type)) {
    throw Errors.validation({ file: ["A UPI screenshot must be an image (JPG, PNG or WebP)"] });
  }

  const sha256 = createHash("sha256").update(upload.bytes).digest("hex");
  const storagePath = newStorageKey(auth.companyId, type);
  await storage.put(storagePath, upload.bytes, type);
  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await attachmentRepository.create(
        {
          companyId: auth.companyId,
          entryId,
          uploadedById: auth.userId,
          kind,
          fileName: cleanFileName(upload.name, type),
          fileType: type,
          fileSize: upload.bytes.byteLength,
          storagePath,
          sha256,
        },
        tx,
      );
      await afterCreate(created, tx);
      return created;
    });
    return { row, sha256, type };
  } catch (error) {
    await storage.remove([storagePath]).catch(() => undefined);
    throw error;
  }
}

/** Audit entry for an upload. On an entry, it shows in that entry's activity timeline. */
export function uploadAudit(auth: AuthContext, row: AttachmentRow, entryId: string | null, meta: RequestMeta, extra?: Record<string, string | boolean>) {
  return {
    companyId: auth.companyId,
    userId: auth.userId,
    action: AUDIT_ACTIONS.attachmentUploaded,
    entityType: entryId ? "transaction" : "attachment",
    entityId: entryId ?? row.id,
    newValues: { attachmentId: row.id, kind: row.kind, fileName: row.fileName, fileType: row.fileType, fileSize: row.fileSize, ...extra },
    meta,
  };
}

/** Opportunistic cleanup, so abandoned uploads don't accumulate. Never fails the caller. */
export function sweepOrphans(companyId: string) {
  if (Math.random() > 0.1) return;
  void (async () => {
    const orphans = await attachmentRepository.findOrphans(companyId, new Date(Date.now() - ORPHAN_TTL_MS));
    if (!orphans.length) return;
    await attachmentRepository.deleteMany(companyId, orphans.map((o) => o.id));
    await objectStorage()?.remove(orphans.map((o) => o.storagePath));
  })().catch((error) => logger.warn("Orphaned attachment cleanup failed", { error }));
}

async function loadEditableEntry(auth: AuthContext, entryId: string) {
  const entry = await entryRepository.findById(auth.companyId, entryId);
  if (!entry) throw Errors.notFound("TRANSACTION_NOT_FOUND", "Transaction not found.");
  assertEntryAction(auth, entry, "edit");
  return entry;
}

export async function uploadAttachment(
  auth: AuthContext,
  upload: Upload,
  input: z.output<typeof uploadAttachmentSchema>,
  meta: RequestMeta,
): Promise<AttachmentDTO> {
  if (input.entryId) {
    await loadEditableEntry(auth, input.entryId);
    if ((await attachmentRepository.countForEntry(auth.companyId, input.entryId)) >= ATTACHMENTS_PER_ENTRY) {
      throw Errors.validation({ file: [`An entry can have at most ${ATTACHMENTS_PER_ENTRY} attachments`] });
    }
  } else {
    assertPermission(auth, "transactions.create");
  }
  await limitUploads(auth);

  const { row } = await storeUpload(auth, upload, input.kind, input.entryId ?? null, (created, tx) =>
    recordAudit(uploadAudit(auth, created, input.entryId ?? null, meta), tx),
  );
  sweepOrphans(auth.companyId);
  return toAttachmentDTO(row);
}

/**
 * Who may see a file: anyone who can read transactions, for a file on a live entry;
 * only the uploader, for one that isn't on an entry yet.
 */
async function loadVisibleAttachment(auth: AuthContext, id: string) {
  const attachment = await attachmentRepository.findById(auth.companyId, id);
  const notFound = () => Errors.notFound("ATTACHMENT_NOT_FOUND", "Attachment not found.");
  if (!attachment) throw notFound();
  if (attachment.entry) {
    if (attachment.entry.deletedAt || !auth.permissions.has("transactions.read")) throw notFound();
  } else if (attachment.uploadedById !== auth.userId) {
    throw notFound();
  }
  return attachment;
}

export async function serveAttachment(auth: AuthContext, id: string, download: boolean) {
  const attachment = await loadVisibleAttachment(auth, id);
  return requireStorage().respond(attachment.storagePath, { fileName: attachment.fileName, contentType: attachment.fileType, download });
}

export async function deleteAttachment(auth: AuthContext, id: string, meta: RequestMeta) {
  const attachment = await loadVisibleAttachment(auth, id);
  if (attachment.entry) await loadEditableEntry(auth, attachment.entry.id);

  await prisma.$transaction(async (tx) => {
    await attachmentRepository.deleteMany(auth.companyId, [attachment.id], tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.attachmentDeleted,
        entityType: attachment.entry ? "transaction" : "attachment",
        entityId: attachment.entry?.id ?? attachment.id,
        oldValues: { attachmentId: attachment.id, kind: attachment.kind, fileName: attachment.fileName },
        meta,
      },
      tx,
    );
  });
  // The row is the source of truth; a leftover object is harmless, so don't fail the request over it.
  await requireStorage()
    .remove([attachment.storagePath])
    .catch((error) => logger.warn("Failed to remove stored attachment", { id: attachment.id, error }));
  return { id: attachment.id, label: ATTACHMENT_KIND_LABELS[attachment.kind] };
}

/** Inside the create-entry transaction: move the creator's pending uploads onto the entry. */
export async function linkAttachments(auth: AuthContext, ids: string[], entryId: string, tx: DbClient) {
  if (!ids.length) return 0;
  const unique = [...new Set(ids)];
  const linked = await attachmentRepository.linkToEntry(auth.companyId, auth.userId, unique, entryId, tx);
  if (linked !== unique.length) {
    throw Errors.validation({ attachmentIds: ["An attached file is no longer available. Remove it and upload it again."] });
  }
  return linked;
}
