import "server-only";
import { isPermissionKey, type PermissionKey } from "@/config/permissions";
import { Errors } from "@/lib/api/errors";
import type { AuthContext } from "@/types/auth";

/**
 * Anti-escalation rule: an actor may only grant (via roles) or manage (via users)
 * a set of permissions they hold themselves. The owner holds every permission.
 */
export function assertPermissionSubset(auth: AuthContext, permissions: readonly string[], action: string) {
  if (auth.isOwner) return;
  const missing = permissions.filter((p) => !isPermissionKey(p) || !auth.permissions.has(p as PermissionKey));
  if (missing.length) {
    throw Errors.forbidden(`You can't ${action} with permissions you don't have yourself.`);
  }
}

export function rolePermissionKeys(role: { permissions: { permission: { key: string } }[] }): PermissionKey[] {
  return role.permissions.map((rp) => rp.permission.key).filter(isPermissionKey);
}
