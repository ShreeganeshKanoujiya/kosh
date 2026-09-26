import "server-only";
import { NextResponse } from "next/server";
import type { ApiErrorBody, ApiSuccess } from "@/types/api";
import type { AppError } from "./errors";

const NO_STORE = { "Cache-Control": "no-store" };

export function ok<T>(data: T, init?: { message?: string; status?: number }) {
  const body: ApiSuccess<T> = { success: true, data, ...(init?.message ? { message: init.message } : {}) };
  return NextResponse.json(body, { status: init?.status ?? 200, headers: NO_STORE });
}

export function created<T>(data: T, message?: string) {
  return ok(data, { message, status: 201 });
}

/** A file download (exports). Failures still answer with the JSON error envelope. */
export function file(f: { body: Uint8Array<ArrayBuffer>; contentType: string; filename: string }) {
  return new NextResponse(f.body, {
    status: 200,
    headers: {
      ...NO_STORE,
      "Content-Type": f.contentType,
      "Content-Length": String(f.body.byteLength),
      "Content-Disposition": `attachment; filename="${f.filename.replace(/[^\w.-]/g, "_")}"`,
    },
  });
}

export function fail(error: Pick<AppError, "code" | "message" | "status" | "details">) {
  const body: ApiErrorBody = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };
  const headers: Record<string, string> = { ...NO_STORE };
  const retryAfter = (error.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds;
  if (error.status === 429 && retryAfter) headers["Retry-After"] = String(retryAfter);
  return NextResponse.json(body, { status: error.status, headers });
}
