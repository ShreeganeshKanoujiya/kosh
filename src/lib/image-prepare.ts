"use client";

import { ATTACHMENT_MAX_BYTES } from "@/config/attachments";

const RESIZABLE = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Phone camera photos are often 3–8 MB; shrink big images in the browser before uploading
 * so they fit the upload limit and send quickly on mobile data. Screenshots and small
 * images pass through untouched (re-encoding would only blur text the OCR needs).
 */
export async function prepareImageForUpload(file: File, opts: { maxEdge?: number; softLimit?: number } = {}): Promise<File> {
  const maxEdge = opts.maxEdge ?? 2400;
  const softLimit = opts.softLimit ?? 2.5 * 1024 * 1024;
  if (!RESIZABLE.has(file.type) || file.size <= softLimit || typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    for (const quality of [0.88, 0.8, 0.7]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= ATTACHMENT_MAX_BYTES) {
        return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg", { type: "image/jpeg", lastModified: file.lastModified });
      }
    }
  } catch {
    // Unsupported/corrupt image: let the server's validation give the user a clear message.
  }
  return file;
}
