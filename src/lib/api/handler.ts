import "server-only";
import type { NextRequest } from "next/server";
import { ZodError, z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { assertSameOrigin } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { AppError, Errors, isAppError } from "./errors";
import { fail } from "./response";

type RouteHandler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<Response>;

/**
 * Wraps every Route Handler:
 *  - CSRF origin check for state-changing methods
 *  - uniform error envelope; internal errors are logged, never leaked
 */
export function apiRoute<Ctx = unknown>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (error) {
      return errorToResponse(error, req);
    }
  };
}

export function errorToResponse(error: unknown, req?: NextRequest) {
  if (isAppError(error)) return fail(error);

  if (error instanceof ZodError) {
    return fail(Errors.validation(z.flattenError(error).fieldErrors as Record<string, string[]>));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return fail(Errors.conflict("ALREADY_EXISTS", "A record with these details already exists."));
    }
    if (error.code === "P2025") return fail(Errors.notFound());
    if (error.code === "P2003") {
      return fail(Errors.badRequest("INVALID_REFERENCE", "A referenced record does not exist."));
    }
  }

  logger.error("Unhandled API error", {
    path: req?.nextUrl.pathname,
    method: req?.method,
    error,
  });
  return fail(new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500));
}
