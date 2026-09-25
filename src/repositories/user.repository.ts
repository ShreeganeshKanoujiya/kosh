import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";
import type { Prisma, UserStatus } from "@/generated/prisma/client";
import type { ListUsersQuery } from "@/validators/user.schema";

export const userWithRole = {
  role: { select: { id: true, name: true, key: true } },
  company: { select: { ownerUserId: true } },
} as const satisfies Prisma.UserInclude;

export type UserWithRole = Prisma.UserGetPayload<{ include: typeof userWithRole }>;

export const userRepository = {
  /** Includes disabled users (so we can tell them apart) but never soft-deleted ones. */
  findForLogin(companyId: string, username: string, db: DbClient = prisma) {
    return db.user.findFirst({
      where: { companyId, username, deletedAt: null },
      select: { id: true, companyId: true, passwordHash: true, status: true, fullName: true, username: true },
    });
  },

  findForPasswordReset(companyId: string, username: string, db: DbClient = prisma) {
    return db.user.findFirst({
      where: { companyId, username, deletedAt: null },
      select: { id: true, username: true, fullName: true, email: true, status: true },
    });
  },

  findById(companyId: string, userId: string, db: DbClient = prisma) {
    return db.user.findFirst({
      where: { companyId, id: userId, deletedAt: null },
      include: userWithRole,
    });
  },

  findByUsername(companyId: string, username: string, db: DbClient = prisma) {
    // Soft-deleted usernames stay reserved, so include them.
    return db.user.findUnique({ where: { companyId_username: { companyId, username } }, select: { id: true } });
  },

  async list(companyId: string, query: ListUsersQuery, db: DbClient = prisma) {
    const where: Prisma.UserWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.roleId ? { roleId: query.roleId } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" } },
              { username: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        include: userWithRole,
        orderBy: [{ createdAt: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      db.user.count({ where }),
    ]);
    return { items, total };
  },

  create(
    data: {
      companyId: string;
      username: string;
      email: string | null;
      fullName: string;
      passwordHash: string;
      roleId: string;
      status: UserStatus;
      createdById: string | null;
    },
    db: DbClient,
  ) {
    return db.user.create({ data: { ...data, passwordChangedAt: new Date() }, include: userWithRole });
  },

  update(
    companyId: string,
    userId: string,
    data: Prisma.UserUncheckedUpdateInput,
    db: DbClient = prisma,
  ) {
    return db.user.update({ where: { companyId_id: { companyId, id: userId } }, data, include: userWithRole });
  },

  countActive(companyId: string, db: DbClient = prisma) {
    return db.user.count({ where: { companyId, deletedAt: null, status: "active" } });
  },
};
