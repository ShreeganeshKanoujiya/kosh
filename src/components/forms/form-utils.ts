"use client";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiClientError } from "@/lib/api-client";

/**
 * Map server-side validation errors onto form fields. Returns true when at least
 * one field error was applied (so the caller can skip a generic toast).
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): boolean {
  if (!(error instanceof ApiClientError)) return false;
  let applied = false;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (messages?.length && (fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: "server", message: messages[0] }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
