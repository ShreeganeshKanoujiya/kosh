export interface StoredFileInfo {
  fileName: string;
  contentType: string;
  /** Save as a file instead of showing it in the browser. */
  download: boolean;
}

/** Where attachment bytes live. Keys are random and company-scoped; never user-supplied. */
export interface ObjectStorage {
  driver: "supabase" | "local";
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
  /** The HTTP response that delivers the file (called only after the caller's permission check). */
  respond(key: string, file: StoredFileInfo): Promise<Response>;
}
