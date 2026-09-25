import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { AUTH_COOKIES } from "@/config/auth";
import type { PermissionKey } from "@/config/permissions";
import { Errors } from "@/lib/api/errors";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { resolveAuthContext } from "@/services/session.service";
import type { AuthContext } from "@/types/auth";

/**
 * The single entry point for "who is making this request?".
 * JWT verification + a database lookup, memoised for the lifetime of one request.
 * company_id / user_id / permissions are *only* ever taken from here.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const store = await cookies();
  const result = await verifyAccessToken(store.get(AUTH_COOKIES.access)?.value);
  if (!result.valid) return null;
  return resolveAuthContext(result.claims);
});

export function hasPermission(auth: AuthContext, ...required: PermissionKey[]): boolean {
  return required.every((p) => auth.permissions.has(p));
}

export function hasAnyPermission(auth: AuthContext, ...required: PermissionKey[]): boolean {
  return required.some((p) => auth.permissions.has(p));
}

export function assertPermission(auth: AuthContext, ...required: PermissionKey[]) {
  if (!hasPermission(auth, ...required)) throw Errors.forbidden();
}

// ─── Route Handlers / services: throw AppErrors ────────────────────────────

export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) throw Errors.unauthorized();
  return auth;
}

export async function requirePermission(...required: PermissionKey[]): Promise<AuthContext> {
  const auth = await requireAuth();
  assertPermission(auth, ...required);
  return auth;
}

// ─── Pages / layouts: redirect or render the 403 boundary ─────────────────

export async function requirePageAuth(...required: PermissionKey[]): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?reason=session");
  if (required.length && !hasPermission(auth, ...required)) forbidden();
  return auth;
}

export async function requireAnyPagePermission(...required: PermissionKey[]): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?reason=session");
  if (!hasAnyPermission(auth, ...required)) forbidden();
  return auth;
}
