import "server-only";
import { ALL_PERMISSION_KEYS, PERMISSIONS, SYSTEM_ROLES, type PermissionKey, type SystemRoleKey } from "@/config/permissions";
import { prisma, type DbClient } from "@/lib/db/prisma";
import { permissionRepository } from "@/repositories/permission.repository";
import { roleRepository } from "@/repositories/role.repository";

function catalogEntries() {
  return ALL_PERMISSION_KEYS.map((key) => ({
    key,
    group: PERMISSIONS[key].group,
    description: PERMISSIONS[key].description,
  }));
}

/** Make sure every permission in src/config/permissions.ts exists in the database. Idempotent. */
export async function ensurePermissionCatalog(db: DbClient = prisma) {
  const existing = await permissionRepository.findByKeys(ALL_PERMISSION_KEYS, db);
  if (existing.length === ALL_PERMISSION_KEYS.length) return;
  await permissionRepository.upsertMany(catalogEntries(), db);
}

export async function permissionIdsFor(keys: readonly PermissionKey[], db: DbClient = prisma): Promise<string[]> {
  const rows = await permissionRepository.findByKeys(keys, db);
  if (rows.length !== new Set(keys).size) {
    throw new Error("Permission catalogue is out of date. Run `npm run db:seed`.");
  }
  return rows.map((r) => r.id);
}

/** Create the five system roles for a new company. Returns role ids by key. */
export async function createSystemRoles(companyId: string, db: DbClient) {
  const ids = {} as Record<SystemRoleKey, string>;
  for (const [key, def] of Object.entries(SYSTEM_ROLES) as [SystemRoleKey, (typeof SYSTEM_ROLES)[SystemRoleKey]][]) {
    const permissionIds = await permissionIdsFor(def.permissions, db);
    const role = await roleRepository.create(
      companyId,
      { name: def.name, description: def.description, key, isSystemRole: true },
      permissionIds,
      db,
    );
    ids[key] = role.id;
  }
  return ids;
}

/**
 * Re-apply default permissions to every company's system roles. Run by the seed script
 * after the catalogue changes so existing companies pick up new permissions.
 */
export async function syncSystemRolePermissions(db: DbClient = prisma) {
  const roles = await db.role.findMany({ where: { isSystemRole: true, key: { not: null } }, select: { id: true, key: true } });
  let updated = 0;
  for (const role of roles) {
    const def = SYSTEM_ROLES[role.key as SystemRoleKey];
    if (!def) continue;
    await roleRepository.replacePermissions(role.id, await permissionIdsFor(def.permissions, db), db);
    updated++;
  }
  return updated;
}
