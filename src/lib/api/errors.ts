/**
 * Application error with a stable machine-readable `code`, a user-safe `message`
 * and the HTTP status to respond with. Anything that is not an AppError is treated
 * as an internal error and never exposed to the client.
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type FieldErrors = Record<string, string[] | undefined>;

export const Errors = {
  validation: (fieldErrors?: FieldErrors, message = "Please check the highlighted fields.") =>
    new AppError("VALIDATION_ERROR", message, 422, fieldErrors ? { fieldErrors } : undefined),
  badRequest: (code: string, message: string) => new AppError(code, message, 400),
  unauthorized: (message = "Please log in to continue.") => new AppError("UNAUTHORIZED", message, 401),
  sessionExpired: () => new AppError("SESSION_EXPIRED", "Your session has expired. Please log in again.", 401),
  forbidden: (message = "You don't have permission to perform this action.") =>
    new AppError("FORBIDDEN", message, 403),
  notFound: (code = "NOT_FOUND", message = "The requested resource was not found.") =>
    new AppError(code, message, 404),
  conflict: (code: string, message: string, details?: unknown) => new AppError(code, message, 409, details),
  rateLimited: (retryAfterSeconds: number, message = "Too many attempts. Please try again later.") =>
    new AppError("RATE_LIMITED", message, 429, { retryAfterSeconds }),
} as const;

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
