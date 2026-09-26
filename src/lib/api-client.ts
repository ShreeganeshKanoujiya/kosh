"use client";

import type { ApiResponse } from "@/types/api";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  get fieldErrors(): Record<string, string[]> {
    const fe = (this.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors;
    return fe ?? {};
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

let refreshing: Promise<boolean> | null = null;

/** One in-flight refresh shared by every request that hit a 401 at the same time. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (refreshing = null), 0);
    });
  return refreshing;
}

function toLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  // Hard navigation on purpose: drop all client state when the session is gone.
  window.location.replace(`${window.location.origin}/login?reason=session&next=${encodeURIComponent(next)}`);
}

async function send(path: string, options: RequestOptions) {
  return fetch(path, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
}

/** Send, and on a 401 renew the session once and retry (or go to login). */
async function sendAuthed(path: string, options: RequestOptions) {
  let res = await send(path, options);

  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    if (await refreshSession()) {
      res = await send(path, options);
    }
    if (res.status === 401) {
      toLogin();
      throw new ApiClientError("SESSION_EXPIRED", "Your session has expired. Please log in again.", 401);
    }
  }
  return res;
}

/**
 * Typed fetch for our REST API. Unwraps the `{ success, data }` envelope and
 * throws ApiClientError on failure. Session renewal normally happens in the
 * proxy; this is the fallback when a request races an expiring token.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; message?: string }> {
  const res = await sendAuthed(path, options);
  return unwrap<T>(res);
}

/**
 * POST to an endpoint that answers with a file (exports) and hand it to the browser
 * as a download. Errors still arrive as the JSON envelope and throw ApiClientError.
 */
export async function apiDownload(path: string): Promise<{ filename: string }> {
  const res = await sendAuthed(path, { method: "POST" });
  if (!res.ok) await unwrap(res);

  const blob = await res.blob();
  const filename = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "export";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { filename };
}

async function unwrap<T>(res: Response): Promise<{ data: T; message?: string }> {
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    // non-JSON (e.g. proxy error page)
  }

  if (!body) {
    throw new ApiClientError("NETWORK_ERROR", "Unable to reach the server. Please try again.", res.status);
  }
  if (!body.success) {
    throw new ApiClientError(body.error.code, body.error.message, res.status, body.error.details);
  }
  return { data: body.data, message: body.message };
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error && error.name === "AbortError") return "Request cancelled.";
  return fallback;
}
