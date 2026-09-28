import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma, type DbClient } from "@/lib/db/prisma";

export const attachmentSelect = {
  id: true,
  entryId: true,
  kind: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  createdAt: true,
  uploadedBy: { select: { id: true, fullName: true } },
} as const satisfies Prisma.AttachmentSelect;

export type AttachmentRow = Prisma.AttachmentGetPayload<{ select: typeof attachmentSelect }>;

export const attachmentRepository = {
  create(data: Prisma.AttachmentUncheckedCreateInput, db: DbClient = prisma) {
    return db.attachment.create({ data, select: attachmentSelect });
  },

  /** Company-scoped lookup, with the owning entry's state for access checks. */
  findById(companyId: string, id: string, db: DbClient = prisma) {
    return db.attachment.findFirst({
      where: { companyId, id },
      select: {
        ...attachmentSelect,
        storagePath: true,
        uploadedById: true,
        entry: { select: { id: true, deletedAt: true } },
      },
    });
  },

  countForEntry(companyId: string, entryId: string, db: DbClient = prisma) {
    return db.attachment.count({ where: { companyId, entryId } });
  },

  /**
   * Attach the uploader's own not-yet-linked files to a new entry. Returns how many were
   * linked; fewer than asked means some id was foreign, taken or already gone.
   */
  async linkToEntry(companyId: string, uploadedById: string, ids: string[], entryId: string, db: DbClient) {
    const { count } = await db.attachment.updateMany({
      where: { companyId, uploadedById, entryId: null, id: { in: ids } },
      data: { entryId },
    });
    return count;
  },

  /** Entries (not deleted) that already carry a file with these exact bytes. */
  findEntriesWithSameFile(companyId: string, sha256: string, excludeId: string, db: DbClient = prisma) {
    return db.attachment.findMany({
      where: { companyId, sha256, id: { not: excludeId }, entry: { deletedAt: null } },
      select: { entry: { select: { id: true, entryNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  },

  /** Uploads that never made it onto an entry (an abandoned form or scan). */
  findOrphans(companyId: string, olderThan: Date, db: DbClient = prisma) {
    return db.attachment.findMany({
      where: { companyId, entryId: null, createdAt: { lt: olderThan } },
      select: { id: true, storagePath: true },
      take: 100,
    });
  },

  deleteMany(companyId: string, ids: string[], db: DbClient = prisma) {
    return db.attachment.deleteMany({ where: { companyId, id: { in: ids } } });
  },
};
