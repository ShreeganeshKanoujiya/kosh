import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ObjectStorage } from "./types";

/**
 * Files on local disk — for development and single-server self-hosting. Serverless
 * platforms have no persistent disk, so production there must use Supabase Storage.
 */
export function diskStorage(root: string): ObjectStorage {
  const dir = path.resolve(root);
  const fileFor = (key: string) => {
    const full = path.resolve(dir, ...key.split("/"));
    // Keys are generated server-side, but never let one escape the upload directory.
    if (!full.startsWith(dir + path.sep)) throw new Error("Invalid storage key");
    return full;
  };

  return {
    driver: "local",

    async put(key, body) {
      const file = fileFor(key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body, { flag: "wx" });
    },

    async remove(keys) {
      await Promise.all(keys.map((key) => rm(fileFor(key), { force: true })));
    },

    async respond(key, file) {
      const body = await readFile(fileFor(key));
      const name = encodeURIComponent(file.fileName);
      return new Response(new Uint8Array(body), {
        status: 200,
        headers: {
          "Content-Type": file.contentType,
          "Content-Length": String(body.byteLength),
          "Content-Disposition": `${file.download ? "attachment" : "inline"}; filename*=UTF-8''${name}`,
          "Cache-Control": "private, max-age=300",
          "X-Content-Type-Options": "nosniff",
          // Nothing in a file may run as our origin. (Chrome won't render a PDF under `sandbox`,
          // so PDFs get the lock-down without it; they're sniffed as real PDFs on upload.)
          "Content-Security-Policy": file.contentType.startsWith("image/")
            ? "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'self'; sandbox"
            : "default-src 'none'; object-src 'self'; frame-ancestors 'self'",
        },
      });
    },
  };
}
