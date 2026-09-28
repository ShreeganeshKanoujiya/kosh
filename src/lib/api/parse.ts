import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { Errors } from "./errors";

const MAX_JSON_BYTES = 256 * 1024;

/** Parse and validate a JSON request body. Never trust the client shape. */
export async function parseBody<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.output<S>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw Errors.badRequest("UNSUPPORTED_CONTENT_TYPE", "Expected a JSON request body.");
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_JSON_BYTES) throw Errors.badRequest("PAYLOAD_TOO_LARGE", "Request body is too large.");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw Errors.badRequest("INVALID_JSON", "Request body is not valid JSON.");
  }
  return validate(schema, raw);
}

export interface Upload {
  bytes: Uint8Array;
  /** Untrusted: for display only after sanitising. */
  name: string;
  /** The other (text) form fields. */
  fields: Record<string, string>;
}

/** Read a multipart upload with one file in `file`. Size is checked before and after buffering. */
export async function parseUpload(req: NextRequest, maxBytes: number): Promise<Upload> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw Errors.badRequest("UNSUPPORTED_CONTENT_TYPE", "Expected a file upload.");
  }
  const tooLarge = () => Errors.validation({ file: [`The file is larger than ${Math.round(maxBytes / (1024 * 1024))} MB`] }, "That file is too large.");
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes + 64 * 1024) throw tooLarge();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw Errors.badRequest("INVALID_UPLOAD", "The upload couldn't be read. Please try again.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw Errors.validation({ file: ["Choose a file to upload"] });
  if (file.size > maxBytes) throw tooLarge();

  const fields: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") fields[key] = value;
  });
  return { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name, fields };
}

/** Parse and validate URL search params (single values only). */
export function parseQuery<S extends z.ZodType>(req: NextRequest, schema: S): z.output<S> {
  const raw: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    if (value !== "") raw[key] = value;
  });
  return validate(schema, raw);
}

export function validate<S extends z.ZodType>(schema: S, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw Errors.validation(z.flattenError(result.error).fieldErrors as Record<string, string[]>);
  }
  return result.data;
}

/** Validate a route param as a UUID so malformed ids 404 instead of hitting the DB. */
export function parseId(value: string, code = "NOT_FOUND"): string {
  const result = z.uuid().safeParse(value);
  if (!result.success) throw Errors.notFound(code);
  return result.data;
}
