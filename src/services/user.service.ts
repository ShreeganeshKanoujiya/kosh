import "server-only";
import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AppError, Errors } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import type { RequestMeta } from "@/lib/security/request-meta";
import { roleRepository } from "@/repositories/role.repository";
import { sessionRepository } from "@/repositories/session.repository";
import { userRepository, type UserWithRole } from "@/repositories/user.repository";
import type { Paginated } from "@/types/api";
import type { AuthContext } from "@/types/auth";
import type { UserDTO } from "@/types/dto";
import type {
  adminResetPasswordSchema,
  createUserSchema,
  ListUsersQuery,
  updateUserSchema,
} from "@/validators/user.schema";
import { AUDIT_ACTIONS, recordAudit } from "./audit.service";
import { assertPermissionSubset, rolePermissionKeys } from "./authorization";

export function toUserDTO(user: UserWithRole): UserDTO {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    status: user.status,
    role: { id: user.role.id, name: user.role.name, key: user.role.key },
    isOwner: user.company.ownerUserId === user.id,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

async function loadTarget(auth: AuthContext, userId: string) {
  const user = await userRepository.findById(auth.companyId, userId);
  if (!user) throw Errors.notFound("USER_NOT_FOUND", "User not found.");
  return user;
}

async function loadAssignableRole(auth: AuthContext, roleId: string) {
  const role = await roleRepository.findById(auth.companyId, roleId);
  if (!role) throw Errors.validation({ roleId: ["Select a valid role"] }, "Select a valid role.");
  if (role.key === "owner") throw Errors.forbidden("The Owner role can't be assigned.");
  assertPermissionSubset(auth, rolePermissionKeys(role), "assign a role");
  return role;
}

/** The actor must out-rank the target: owners are untouchable, and you can't manage someone with more access than you. */
async function assertCanManage(auth: AuthContext, target: UserWithRole) {
  const targetIsOwner = target.company.ownerUserId === target.id;
  if (targetIsOwner && !auth.isOwner) throw Errors.forbidden("Only the owner can change the owner's account.");
  if (target.id === auth.userId) return;
  const role = await roleRepository.findById(auth.companyId, target.role.id);
  assertPermissionSubset(auth, role ? rolePermissionKeys(role) : [], "manage a user");
}

function isUsernameConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    JSON.stringify(error.meta ?? {}).includes("username")
  );
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function listUsers(auth: AuthContext, query: ListUsersQuery): Promise<Paginated<UserDTO>> {
  assertPermission(auth, "users.read");
  const { items, total } = await userRepository.list(auth.companyId, query);
  return {
    items: items.map(toUserDTO),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getUser(auth: AuthContext, userId: string): Promise<UserDTO> {
  assertPermission(auth, "users.read");
  return toUserDTO(await loadTarget(auth, userId));
}

// ─── Commands ───────────────────────────────────────────────────────────────

export async function createUser(auth: AuthContext, input: z.output<typeof createUserSchema>, meta: RequestMeta) {
  assertPermission(auth, "users.create");
  const role = await loadAssignableRole(auth, input.roleId);

  if (await userRepository.findByUsername(auth.companyId, input.username)) {
    throw Errors.validation({ username: ["This username is already taken in your company"] }, "Username is taken.");
  }

  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await userRepository.create(
        {
          companyId: auth.companyId,
          username: input.username,
          email: input.email,
          fullName: input.fullName,
          passwordHash,
          roleId: role.id,
          status: input.status,
          createdById: auth.userId,
        },
        tx,
      );
      await recordAudit(
        {
          companyId: auth.companyId,
          userId: auth.userId,
          action: AUDIT_ACTIONS.userCreated,
          entityType: "user",
          entityId: created.id,
          newValues: { username: created.username, fullName: created.fullName, email: created.email, role: role.name, status: created.status },
          meta,
        },
        tx,
      );
      return created;
    });
    return toUserDTO(user);
  } catch (error) {
    if (isUsernameConflict(error)) {
      throw Errors.validation({ username: ["This username is already taken in your company"] }, "Username is taken.");
    }
    throw error;
  }
}

export async function updateUser(
  auth: AuthContext,
  userId: string,
  input: z.output<typeof updateUserSchema>,
  meta: RequestMeta,
) {
  assertPermission(auth, "users.update");
  const target = await loadTarget(auth, userId);
  await assertCanManage(auth, target);

  const targetIsOwner = target.company.ownerUserId === target.id;
  const roleChanging = input.roleId !== undefined && input.roleId !== target.role.id;
  const statusChanging = input.status !== undefined && input.status !== target.status;

  if ((roleChanging || statusChanging) && target.id === auth.userId) {
    throw Errors.forbidden("You can't change your own role or status.");
  }
  if ((roleChanging || statusChanging) && targetIsOwner) {
    throw Errors.forbidden("The owner's role and status can't be changed.");
  }

  const newRole = roleChanging ? await loadAssignableRole(auth, input.roleId!) : null;

  const data: Prisma.UserUncheckedUpdateInput = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.email !== undefined) data.email = input.email;
  if (newRole) data.roleId = newRole.id;
  if (statusChanging) data.status = input.status;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await userRepository.update(auth.companyId, target.id, data, tx);
    if (statusChanging && input.status === "disabled") {
      await sessionRepository.revokeAllForUser(target.id, "user_disabled", {}, tx);
    }

    const base = { companyId: auth.companyId, userId: auth.userId, entityType: "user", entityId: target.id, meta };
    if (input.fullName !== undefined || input.email !== undefined) {
      await recordAudit(
        {
          ...base,
          action: AUDIT_ACTIONS.userUpdated,
          oldValues: { fullName: target.fullName, email: target.email },
          newValues: { fullName: user.fullName, email: user.email },
        },
        tx,
      );
    }
    if (newRole) {
      await recordAudit(
        { ...base, action: AUDIT_ACTIONS.userRoleChanged, oldValues: { role: target.role.name }, newValues: { role: newRole.name } },
        tx,
      );
    }
    if (statusChanging) {
      await recordAudit(
        {
          ...base,
          action: input.status === "disabled" ? AUDIT_ACTIONS.userDisabled : AUDIT_ACTIONS.userEnabled,
          oldValues: { status: target.status },
          newValues: { status: input.status },
        },
        tx,
      );
    }
    return user;
  });
  return toUserDTO(updated);
}

export async function deleteUser(auth: AuthContext, userId: string, meta: RequestMeta) {
  assertPermission(auth, "users.delete");
  const target = await loadTarget(auth, userId);
  if (target.id === auth.userId) throw Errors.forbidden("You can't delete your own account.");
  if (target.company.ownerUserId === target.id) throw Errors.forbidden("The owner account can't be deleted.");
  await assertCanManage(auth, target);

  // Soft delete: financial records keep referencing the user and the username stays reserved.
  await prisma.$transaction(async (tx) => {
    await userRepository.update(auth.companyId, target.id, { deletedAt: new Date(), status: "disabled" }, tx);
    await sessionRepository.revokeAllForUser(target.id, "user_deleted", {}, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.userDeleted,
        entityType: "user",
        entityId: target.id,
        oldValues: { username: target.username, fullName: target.fullName, role: target.role.name },
        meta,
      },
      tx,
    );
  });
}

export async function resetUserPassword(
  auth: AuthContext,
  userId: string,
  input: z.output<typeof adminResetPasswordSchema>,
  meta: RequestMeta,
) {
  assertPermission(auth, "users.update");
  const target = await loadTarget(auth, userId);
  if (target.id === auth.userId) {
    throw new AppError("USE_CHANGE_PASSWORD", "Use Settings → Security to change your own password.", 400);
  }
  await assertCanManage(auth, target);
  if (input.newPassword.toLowerCase().includes(target.username)) {
    throw Errors.validation({ newPassword: ["Password must not contain the username"] });
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction(async (tx) => {
    await userRepository.update(auth.companyId, target.id, { passwordHash, passwordChangedAt: new Date() }, tx);
    await sessionRepository.revokeAllForUser(target.id, "password_reset_by_admin", {}, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.userPasswordReset,
        entityType: "user",
        entityId: target.id,
        meta,
      },
      tx,
    );
  });
}

export async function revokeUserSessions(auth: AuthContext, userId: string, meta: RequestMeta) {
  assertPermission(auth, "users.update");
  const target = await loadTarget(auth, userId);
  await assertCanManage(auth, target);

  return prisma.$transaction(async (tx) => {
    const count = await sessionRepository.revokeAllForUser(target.id, "revoked_by_admin", {}, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.userSessionsRevoked,
        entityType: "user",
        entityId: target.id,
        newValues: { sessionsRevoked: count },
        meta,
      },
      tx,
    );
    return count;
  });
}
