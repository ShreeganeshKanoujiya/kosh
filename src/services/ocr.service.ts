import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { Upload } from "@/lib/api/parse";
import { assertPermission } from "@/lib/auth/session";
import { todayYmd, ymdToDate } from "@/lib/dates";
import { logger } from "@/lib/logger";
import { recognizeLines } from "@/lib/ocr/tesseract";
import { parseUpiText, type UpiExtraction } from "@/lib/ocr/upi-parser";
import type { RequestMeta } from "@/lib/security/request-meta";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { attachmentRepository } from "@/repositories/attachment.repository";
import { entryRepository } from "@/repositories/entry.repository";
import { settingsRepository } from "@/repositories/settings.repository";
import type { AuthContext } from "@/types/auth";
import type { UpiScanDTO } from "@/types/dto";
import { limitUploads, storeUpload, sweepOrphans, toAttachmentDTO, uploadAudit } from "./attachment.service";
import { recordAudit } from "./audit.service";
import { toDuplicateDTO } from "./transaction.service";

/**
 * Upload → validate → store → OCR (Tesseract) → parse + score → review.
 * Nothing is saved as an entry here: the user confirms (and corrects) every value on
 * the review screen, and the entry is created from that form.
 */
export async function scanUpiScreenshot(auth: AuthContext, upload: Upload, meta: RequestMeta): Promise<UpiScanDTO> {
  assertPermission(auth, "transactions.create");
  await limitUploads(auth);
  // OCR is CPU-heavy; cap it separately from plain uploads.
  await enforceRateLimit(`ocr:${auth.userId}`, { limit: 30, windowSeconds: 600 }, "You've scanned a lot of screenshots in a short time. Please wait a few minutes.");
  const settings = await settingsRepository.get(auth.companyId);
  const today = todayYmd(settings.timezone);

  const { row, sha256 } = await storeUpload(auth, upload, "upi_screenshot", null, (created, tx) =>
    recordAudit(uploadAudit(auth, created, null, meta, { scanned: true }), tx),
  );
  sweepOrphans(auth.companyId);

  let extraction: UpiExtraction | null = null;
  let message: string | null = null;
  try {
    extraction = parseUpiText(await recognizeLines(upload.bytes), today);
    if (!extraction) message = "Couldn't find payment details in this image. Check that it's a UPI payment screenshot, or enter the details yourself.";
  } catch (error) {
    logger.error("UPI screenshot OCR failed", { error });
    message = "Couldn't read the screenshot right now. Enter the details yourself, or try again.";
  }

  const sameFile = await attachmentRepository.findEntriesWithSameFile(auth.companyId, sha256, row.id);
  const f = extraction?.fields;
  const duplicates =
    f?.amount.value && f.entryDate.value
      ? await entryRepository.findDuplicates(auth.companyId, {
          transactionId: f.transactionId.value,
          amount: new Prisma.Decimal(f.amount.value),
          entryDate: ymdToDate(f.entryDate.value),
          merchantName: f.merchantName.value,
        })
      : [];

  return {
    attachment: toAttachmentDTO(row),
    extraction,
    message,
    sameScreenshot: sameFile.flatMap((a) => (a.entry ? [a.entry] : [])),
    duplicates: duplicates.map(toDuplicateDTO),
  };
}
