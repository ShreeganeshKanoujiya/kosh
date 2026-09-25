import "server-only";
import type { z } from "zod";
import { Errors } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { money } from "@/lib/money";
import type { RequestMeta } from "@/lib/security/request-meta";
import { cashAccountRepository } from "@/repositories/cash-account.repository";
import { settingsRepository } from "@/repositories/settings.repository";
import type { AuthContext } from "@/types/auth";
import type { CashAccountDTO } from "@/types/dto";
import type { cashAccountSchema, updateCashAccountSchema } from "@/validators/company.schema";
import { AUDIT_ACTIONS, recordAudit } from "./audit.service";

type Row = NonNullable<Awaited<ReturnType<typeof cashAccountRepository.findById>>>;

const toDTO = (a: Row, defaultId: string | null): CashAccountDTO => ({
  id: a.id,
  name: a.name,
  currency: a.currency,
  openingBalance: money(a.openingBalance),
  currentBalance: money(a.currentBalance),
  isActive: a.isActive,
  isDefault: a.id === defaultId,
});

export async function listCashAccounts(auth: AuthContext, options: { activeOnly?: boolean } = {}): Promise<CashAccountDTO[]> {
  // Entry forms need the account list even for roles that can't see balances.
  const canSeeBalances = auth.permissions.has("cash_accounts.read");
  if (!canSeeBalances && !auth.permissions.has("transactions.create")) throw Errors.forbidden();
  const [rows, settings] = await Promise.all([
    cashAccountRepository.list(auth.companyId, options),
    settingsRepository.get(auth.companyId),
  ]);
  return rows.map((r) => {
    const dto = toDTO(r, settings.defaultCashAccountId);
    return canSeeBalances ? dto : { ...dto, openingBalance: "", currentBalance: "" };
  });
}

async function assertNameFree(companyId: string, name: string, exceptId?: string) {
  const existing = await cashAccountRepository.findByName(companyId, name);
  if (existing && existing.id !== exceptId) {
    throw Errors.validation({ name: ["An account with this name already exists"] }, "Account name is taken.");
  }
}

export async function createCashAccount(auth: AuthContext, input: z.output<typeof cashAccountSchema>, meta: RequestMeta) {
  assertPermission(auth, "cash_accounts.manage");
  await assertNameFree(auth.companyId, input.name);
  const settings = await settingsRepository.get(auth.companyId);
  const row = await prisma.$transaction(async (tx) => {
    const created = await cashAccountRepository.create(auth.companyId, input, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.cashAccountCreated,
        entityType: "cash_account",
        entityId: created.id,
        newValues: { name: created.name, openingBalance: money(created.openingBalance), currency: created.currency },
        meta,
      },
      tx,
    );
    return created;
  });
  return toDTO(row, settings.defaultCashAccountId);
}

export async function updateCashAccount(
  auth: AuthContext,
  id: string,
  input: z.output<typeof updateCashAccountSchema>,
  meta: RequestMeta,
) {
  assertPermission(auth, "cash_accounts.manage");
  const current = await cashAccountRepository.findById(auth.companyId, id);
  if (!current) throw Errors.notFound("CASH_ACCOUNT_NOT_FOUND", "Cash account not found.");
  const settings = await settingsRepository.get(auth.companyId);
  if (input.name) await assertNameFree(auth.companyId, input.name, id);
  if (input.isActive === false && settings.defaultCashAccountId === id) {
    throw Errors.validation({ isActive: ["Choose a different default account before deactivating this one"] });
  }

  const row = await prisma.$transaction(async (tx) => {
    let updated = await cashAccountRepository.update(
      auth.companyId,
      id,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.openingBalance !== undefined ? { openingBalance: input.openingBalance } : {}),
      },
      tx,
    );
    // Opening balance feeds the running balance — recompute from the ledger.
    if (input.openingBalance !== undefined) updated = await cashAccountRepository.recalculate(auth.companyId, id, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.cashAccountUpdated,
        entityType: "cash_account",
        entityId: id,
        oldValues: { name: current.name, openingBalance: money(current.openingBalance), isActive: current.isActive },
        newValues: { name: updated.name, openingBalance: money(updated.openingBalance), isActive: updated.isActive },
        meta,
      },
      tx,
    );
    return updated;
  });
  return toDTO(row, settings.defaultCashAccountId);
}
