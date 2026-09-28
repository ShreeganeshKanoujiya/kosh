import "server-only";
import type { ObjectStorage } from "./types";

/**
 * Supabase Storage over its REST API, authenticated with the server-only service key.
 * The bucket is private: files are only reachable through short-lived signed URLs
 * that the server issues after its own permission check.
 */
export function supabaseStorage(opts: { url: string; key: string; bucket: string }): ObjectStorage {
  const base = `${opts.url.replace(/\/$/, "")}/storage/v1`;
  // Legacy service_role keys are JWTs and go in Authorization too; new `sb_secret_…` keys only in `apikey`.
  const auth: Record<string, string> = { apikey: opts.key, ...(opts.key.startsWith("eyJ") ? { Authorization: `Bearer ${opts.key}` } : {}) };
  const objectPath = (key: string) => `${encodeURIComponent(opts.bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;

  async function call(path: string, init: RequestInit & { json?: unknown }) {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...auth, ...(init.json !== undefined ? { "Content-Type": "application/json" } : {}), ...init.headers },
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Supabase Storage ${init.method ?? "GET"} ${path.split("?")[0]} failed (${res.status}): ${detail.slice(0, 200)}`);
    }
    return res;
  }

  return {
    driver: "supabase",

    async put(key, body, contentType) {
      await call(`/object/${objectPath(key)}`, {
        method: "POST",
        headers: { "Content-Type": contentType, "x-upsert": "false", "Cache-Control": "private, max-age=0" },
        body: Buffer.from(body),
      });
    },

    async remove(keys) {
      if (!keys.length) return;
      await call(`/object/${encodeURIComponent(opts.bucket)}`, { method: "DELETE", json: { prefixes: keys } });
    },

    async respond(key, file) {
      const res = await call(`/object/sign/${objectPath(key)}`, { method: "POST", json: { expiresIn: 60 } });
      const { signedURL } = (await res.json()) as { signedURL: string };
      const url = new URL(`${base}${signedURL}`);
      if (file.download) url.searchParams.set("download", file.fileName);
      return new Response(null, { status: 302, headers: { Location: url.toString(), "Cache-Control": "private, no-store" } });
    },
  };
}
