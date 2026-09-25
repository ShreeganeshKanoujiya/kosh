import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";

const roleWithPermissions = {
  permissions: { select: { permission: { select: { key: true } } } },
  _count: { select: { users: { where: { deletedAt: null } } } },
} as const;

export const roleRepository = {
  listForCompany(companyId: string, db: DbClient = prisma) {
    return db.role.findMany({
      where: { companyId },
      include: roleWithPermissions,
      orderBy: [{ isSystemRole: "desc" }, { createdAt: "asc" }],
    });
  },

  findById(companyId: string, roleId: string, db: DbClient = prisma) {
    return db.role.findUnique({
      where: { companyId_id: { companyId, id: roleId } },
      include: roleWithPermissions,
    });
  },

  findByKey(companyId: string, key: string, db: DbClient = prisma) {
    return db.role.findUnique({ where: { companyId_key: { companyId, key } } });
  },

  findByName(companyId: string, name: string, db: DbClient = prisma) {
    return db.role.findFirst({ where: { companyId, name: { equals: name, mode: "insensitive" } } });
  },

  async create(
    companyId: string,
    data: { name: string; description: string | null; key?: string | null; isSystemRole?: boolean },
    permissionIds: string[],
    db: DbClient,
  ) {
    const role = await db.role.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        key: data.key ?? null,
        isSystemRole: data.isSystemRole ?? false,
      },
    });
    if (permissionIds.length) {
      await db.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      });
    }
    return role;
  },

  update(companyId: string, roleId: string, data: { name?: string; description?: string | null }, db: DbClient) {
    return db.role.update({ where: { companyId_id: { companyId, id: roleId } }, data });
  },

  async replacePermissions(roleId: string, permissionIds: string[], db: DbClient) {
    await db.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length) {
      await db.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId, permissionId })) });
    }
  },

  delete(companyId: string, roleId: string, db: DbClient) {
    return db.role.delete({ where: { companyId_id: { companyId, id: roleId } } });
  },

  countAllUsers(companyId: string, roleId: string, db: DbClient = prisma) {
    // Includes soft-deleted users: the FK still references the role.
    return db.user.count({ where: { companyId, roleId } });
  },
};
