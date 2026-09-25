import "server-only";
import type { z } from "zod";
import { ALL_PERMISSION_KEYS, PERMISSIONS } from "@/config/permissions";
import { Errors } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { RequestMeta } from "@/lib/security/request-meta";
import { roleRepository } from "@/repositories/role.repository";
import type { AuthContext } from "@/types/auth";
import type { PermissionDTO, RoleDTO, RoleSummaryDTO } from "@/types/dto";
import type { createRoleSchema, updateRoleSchema } from "@/validators/role.schema";
import { AUDIT_ACTIONS, recordAudit } from "./audit.service";
import { assertPermissionSubset, rolePermissionKeys } from "./authorization";
import { ensurePermissionCatalog, permissionIdsFor } from "./permission-catalog.service";

type RoleRow = NonNullable<Awaited<ReturnType<typeof roleRepository.findById>>>;

export function toRoleDTO(role: RoleRow): RoleDTO {
  return {
    id: role.id,
    name: role.name,
    key: role.key,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissions: rolePermissionKeys(role).sort(),
    userCount: role._count.users,
    createdAt: role.createdAt.toISOString(),
  };
}

export function listPermissionCatalog(): PermissionDTO[] {
  return ALL_PERMISSION_KEYS.map((key) => ({ key, group: PERMISSIONS[key].group, description: PERMISSIONS[key].description }));
}

export async function listRoles(auth: AuthContext): Promise<RoleDTO[]> {
  assertPermission(auth, "roles.read");
  const roles = await roleRepository.listForCompany(auth.companyId);
  return roles.map(toRoleDTO);
}

/** Lightweight id/name list for filters (anyone who can see users or roles). */
export async function listRoleOptions(auth: AuthContext): Promise<RoleSummaryDTO[]> {
  if (!auth.permissions.has("users.read") && !auth.permissions.has("roles.read")) throw Errors.forbidden();
  const roles = await roleRepository.listForCompany(auth.companyId);
  return roles.map((r) => ({ id: r.id, name: r.name, key: r.key }));
}

/** Roles the current user may assign to others (used by the user form; needs users.create or users.update). */
export async function listAssignableRoles(auth: AuthContext): Promise<RoleDTO[]> {
  if (!auth.permissions.has("users.create") && !auth.permissions.has("users.update")) throw Errors.forbidden();
  const roles = await roleRepository.listForCompany(auth.companyId);
  return roles
    .filter((r) => r.key !== "owner")
    .filter((r) => auth.isOwner || rolePermissionKeys(r).every((p) => auth.permissions.has(p)))
    .map(toRoleDTO);
}

async function assertNameAvailable(companyId: string, name: string, exceptId?: string) {
  const existing = await roleRepository.findByName(companyId, name);
  if (existing && existing.id !== exceptId) {
    throw Errors.validation({ name: ["A role with this name already exists"] }, "Role name is taken.");
  }
}

export async function createRole(auth: AuthContext, input: z.output<typeof createRoleSchema>, meta: RequestMeta) {
  assertPermission(auth, "roles.create");
  assertPermissionSubset(auth, input.permissions, "create a role");
  await assertNameAvailable(auth.companyId, input.name);
  await ensurePermissionCatalog();

  const role = await prisma.$transaction(async (tx) => {
    const created = await roleRepository.create(
      auth.companyId,
      { name: input.name, description: input.description },
      await permissionIdsFor(input.permissions, tx),
      tx,
    );
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.roleCreated,
        entityType: "role",
        entityId: created.id,
        newValues: { name: created.name, permissions: input.permissions },
        meta,
      },
      tx,
    );
    return roleRepository.findById(auth.companyId, created.id, tx);
  });
  return toRoleDTO(role!);
}

export async function updateRole(
  auth: AuthContext,
  roleId: string,
  input: z.output<typeof updateRoleSchema>,
  meta: RequestMeta,
) {
  assertPermission(auth, "roles.update");
  const role = await roleRepository.findById(auth.companyId, roleId);
  if (!role) throw Errors.notFound("ROLE_NOT_FOUND", "Role not found.");
  if (role.isSystemRole) throw Errors.forbidden("System roles can't be edited. Create a custom role instead.");

  const before = rolePermissionKeys(role);
  // You may neither add nor remove permissions you don't hold.
  assertPermissionSubset(auth, before, "edit a role");
  if (input.permissions) assertPermissionSubset(auth, input.permissions, "edit a role");
  if (input.name) await assertNameAvailable(auth.companyId, input.name, role.id);

  const updated = await prisma.$transaction(async (tx) => {
    await roleRepository.update(auth.companyId, role.id, { name: input.name, description: input.description }, tx);
    if (input.permissions) await roleRepository.replacePermissions(role.id, await permissionIdsFor(input.permissions, tx), tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.roleUpdated,
        entityType: "role",
        entityId: role.id,
        oldValues: { name: role.name, description: role.description, permissions: before },
        newValues: {
          name: input.name ?? role.name,
          description: input.description === undefined ? role.description : input.description,
          permissions: input.permissions ?? before,
        },
        meta,
      },
      tx,
    );
    return roleRepository.findById(auth.companyId, role.id, tx);
  });
  return toRoleDTO(updated!);
}

export async function deleteRole(auth: AuthContext, roleId: string, meta: RequestMeta) {
  assertPermission(auth, "roles.delete");
  const role = await roleRepository.findById(auth.companyId, roleId);
  if (!role) throw Errors.notFound("ROLE_NOT_FOUND", "Role not found.");
  if (role.isSystemRole) throw Errors.forbidden("System roles can't be deleted.");
  assertPermissionSubset(auth, rolePermissionKeys(role), "delete a role");

  const inUse = await roleRepository.countAllUsers(auth.companyId, role.id);
  if (inUse > 0) {
    throw Errors.conflict("ROLE_IN_USE", `This role is assigned to ${inUse} user${inUse === 1 ? "" : "s"}. Reassign them first.`);
  }

  await prisma.$transaction(async (tx) => {
    await roleRepository.delete(auth.companyId, role.id, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.roleDeleted,
        entityType: "role",
        entityId: role.id,
        oldValues: { name: role.name, permissions: rolePermissionKeys(role) },
        meta,
      },
      tx,
    );
  });
}
