/**
 * Idempotent seed: syncs the permission catalogue (src/config/permissions.ts) into the
 * database and re-applies default permissions to every company's system roles.
 * Safe to run after every deploy: `npm run db:seed`.
 */
import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { ensurePermissionCatalog, syncSystemRolePermissions } from "@/services/permission-catalog.service";
import { ALL_PERMISSION_KEYS } from "@/config/permissions";

async function main() {
  await ensurePermissionCatalog();
  const updated = await syncSystemRolePermissions();
  console.log(`✔ Permission catalogue synced (${ALL_PERMISSION_KEYS.length} permissions)`);
  console.log(`✔ System role permissions refreshed for ${updated} role(s)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
