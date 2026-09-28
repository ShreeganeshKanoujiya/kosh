import { ATTACHMENT_MAX_BYTES } from "@/config/attachments";
import { apiRoute } from "@/lib/api/handler";
import { parseUpload } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { scanUpiScreenshot } from "@/services/ocr.service";

// A cold start loads the OCR model (~1–2 s) before reading the image.
export const maxDuration = 60;

/**
 * Scan a UPI screenshot (multipart: `file`). Stores it, reads it with Tesseract and returns the
 * detected fields with a confidence each. Nothing is saved as an entry until the user confirms.
 */
export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const upload = await parseUpload(req, ATTACHMENT_MAX_BYTES);
  const result = await scanUpiScreenshot(auth, upload, getRequestMeta(req.headers));
  return ok(result, { message: result.extraction ? "Screenshot processed" : undefined });
});
