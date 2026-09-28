import "server-only";
import { ATTACHMENT_TYPES, type AttachmentMimeType } from "@/config/attachments";

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  bytes.length >= offset + signature.length && signature.every((b, i) => bytes[offset + i] === b);

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

/**
 * The real type of an upload, from its first bytes. The browser-supplied MIME type and
 * the filename are both attacker-controlled, so neither decides what we store.
 */
export function sniffFileType(bytes: Uint8Array): AttachmentMimeType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return "image/webp";
  if (startsWith(bytes, ascii("%PDF-"))) return "application/pdf";
  return null;
}

export const extensionOf = (fileName: string) => /\.([a-z0-9]{1,8})$/i.exec(fileName)?.[1]?.toLowerCase() ?? null;

/** Does the name's extension agree with the detected type? A name without one is accepted. */
export function extensionMatches(fileName: string, type: AttachmentMimeType) {
  const ext = extensionOf(fileName);
  return ext === null || (ATTACHMENT_TYPES[type] as readonly string[]).includes(ext);
}

/** Display-only filename: no path, no control or bidi characters, bounded length. */
export function cleanFileName(raw: string, type: AttachmentMimeType) {
  const base = raw.split(/[\\/]/).pop() ?? "";
  let name = base.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069"<>|?*:]/g, "").trim();
  if (!name || name === "." || name === "..") name = "file";
  if (!extensionOf(name)) name = `${name}.${ATTACHMENT_TYPES[type][0]}`;
  if (name.length > 120) {
    const ext = extensionOf(name)!;
    name = `${name.slice(0, 115 - ext.length)}….${ext}`;
  }
  return name;
}
