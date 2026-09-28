import "server-only";
import { randomBytes } from "node:crypto";
import { env, isProduction } from "@/config/env";
import { ATTACHMENT_TYPES, type AttachmentMimeType } from "@/config/attachments";
import { diskStorage } from "./disk";
import { supabaseStorage } from "./supabase";
import type { ObjectStorage } from "./types";

export type { ObjectStorage } from "./types";

let cached: ObjectStorage | null | undefined;

/** The configured attachment store, or null when uploads aren't set up on this server. */
export function objectStorage(): ObjectStorage | null {
  if (cached !== undefined) return cached;
  const e = env();
  if (e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY) {
    cached = supabaseStorage({ url: e.SUPABASE_URL, key: e.SUPABASE_SERVICE_ROLE_KEY, bucket: e.SUPABASE_STORAGE_BUCKET });
  } else if (e.UPLOAD_DIR || !isProduction()) {
    cached = diskStorage(e.UPLOAD_DIR || ".data/uploads");
  } else {
    cached = null;
  }
  return cached;
}

/** `<company>/<yyyy>/<mm>/<128 random bits>.<ext>` — never derived from the uploaded filename. */
export function newStorageKey(companyId: string, type: AttachmentMimeType, now = new Date()) {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${companyId}/${now.getUTCFullYear()}/${month}/${randomBytes(16).toString("hex")}.${ATTACHMENT_TYPES[type][0]}`;
}
