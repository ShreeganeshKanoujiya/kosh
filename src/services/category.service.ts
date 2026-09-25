import "server-only";
import type { z } from "zod";
import { Errors } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { RequestMeta } from "@/lib/security/request-meta";
import { categoryRepository } from "@/repositories/category.repository";
import type { AuthContext } from "@/types/auth";
import type { CategoryDTO } from "@/types/dto";
import type { categorySchema, updateCategorySchema } from "@/validators/company.schema";
import { AUDIT_ACTIONS, recordAudit } from "./audit.service";

type Row = NonNullable<Awaited<ReturnType<typeof categoryRepository.findById>>>;

const toDTO = (c: Row): CategoryDTO => ({
  id: c.id,
  name: c.name,
  description: c.description,
  isActive: c.isActive,
  entryCount: c._count.entries,
});

export async function listCategories(auth: AuthContext, options: { activeOnly?: boolean } = {}): Promise<CategoryDTO[]> {
  // Anyone who can record or read entries needs the category list for forms and filters.
  if (!(["categories.read", "transactions.create", "transactions.read"] as const).some((p) => auth.permissions.has(p))) {
    throw Errors.forbidden();
  }
  return (await categoryRepository.list(auth.companyId, options)).map(toDTO);
}

async function assertNameFree(companyId: string, name: string, exceptId?: string) {
  const existing = await categoryRepository.findByName(companyId, name);
  if (existing && existing.id !== exceptId) {
    throw Errors.validation({ name: ["A category with this name already exists"] }, "Category name is taken.");
  }
}

export async function createCategory(auth: AuthContext, input: z.output<typeof categorySchema>, meta: RequestMeta) {
  assertPermission(auth, "categories.create");
  await assertNameFree(auth.companyId, input.name);
  const created = await prisma.$transaction(async (tx) => {
    const row = await categoryRepository.create(auth.companyId, input, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.categoryCreated,
        entityType: "category",
        entityId: row.id,
        newValues: { name: row.name, description: row.description, isActive: row.isActive },
        meta,
      },
      tx,
    );
    return row;
  });
  return toDTO(created);
}

export async function updateCategory(auth: AuthContext, id: string, input: z.output<typeof updateCategorySchema>, meta: RequestMeta) {
  assertPermission(auth, "categories.update");
  const current = await categoryRepository.findById(auth.companyId, id);
  if (!current) throw Errors.notFound("CATEGORY_NOT_FOUND", "Category not found.");
  if (input.name) await assertNameFree(auth.companyId, input.name, id);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await categoryRepository.update(auth.companyId, id, input, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.categoryUpdated,
        entityType: "category",
        entityId: id,
        oldValues: { name: current.name, description: current.description, isActive: current.isActive },
        newValues: { name: row.name, description: row.description, isActive: row.isActive },
        meta,
      },
      tx,
    );
    return row;
  });
  return toDTO(updated);
}

/** Categories that were ever used can only be deactivated — history must keep its labels. */
export async function deleteCategory(auth: AuthContext, id: string, meta: RequestMeta) {
  assertPermission(auth, "categories.delete");
  const current = await categoryRepository.findById(auth.companyId, id);
  if (!current) throw Errors.notFound("CATEGORY_NOT_FOUND", "Category not found.");
  if ((await categoryRepository.countAllEntries(auth.companyId, id)) > 0) {
    throw Errors.conflict("CATEGORY_IN_USE", "This category has entries. Deactivate it instead so past entries keep their category.");
  }
  await prisma.$transaction(async (tx) => {
    await categoryRepository.delete(auth.companyId, id, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.categoryDeleted,
        entityType: "category",
        entityId: id,
        oldValues: { name: current.name },
        meta,
      },
      tx,
    );
  });
}
