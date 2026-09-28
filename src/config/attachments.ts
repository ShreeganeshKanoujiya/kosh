// Receipt / screenshot attachments — limits and labels shared by client and server.

export const ATTACHMENT_KINDS = ["upi_screenshot", "receipt", "bill", "invoice", "other"] as const;
export type AttachmentKindValue = (typeof ATTACHMENT_KINDS)[number];

export const ATTACHMENT_KIND_LABELS: Record<AttachmentKindValue, string> = {
  upi_screenshot: "UPI screenshot",
  receipt: "Receipt",
  bill: "Bill",
  invoice: "Invoice",
  other: "Other document",
};

/**
 * Per-file limit. Uploads pass through our API (so the bytes can be checked before they're
 * stored), and serverless hosts cap request bodies at ~4.5 MB. Phone photos are downscaled
 * in the browser first, so in practice only large PDFs hit this.
 */
export const ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;
export const ATTACHMENTS_PER_ENTRY = 10;

/** Detected type → extensions a file of that type may carry. */
export const ATTACHMENT_TYPES = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
} as const;
export type AttachmentMimeType = keyof typeof ATTACHMENT_TYPES;

export const IMAGE_TYPES: readonly AttachmentMimeType[] = ["image/jpeg", "image/png", "image/webp"];

/** `accept` attribute for file inputs. */
export const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf";
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
