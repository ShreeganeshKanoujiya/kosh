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
