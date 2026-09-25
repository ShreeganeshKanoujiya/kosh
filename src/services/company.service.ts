import "server-only";
import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { Errors } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { RequestMeta } from "@/lib/security/request-meta";
import { cashAccountRepository } from "@/repositories/cash-account.repository";
import { settingsRepository } from "@/repositories/settings.repository";
import type { AuthContext } from "@/types/auth";
import type { CompanySettingsDTO } from "@/types/dto";
import type { updateCompanySchema, updateSettingsSchema } from "@/validators/company.schema";
import { AUDIT_ACTIONS, recordAudit } from "./audit.service";

type SettingsRow = Awaited<ReturnType<typeof settingsRepository.get>>;

export function toSettingsDTO(s: SettingsRow): CompanySettingsDTO {
  return {
    companyName: s.company.name,
    companyCode: s.company.companyCode,
    currency: s.currency,
    timezone: s.timezone,
    financialYearStartMonth: s.financialYearStartMonth,
    defaultCashAccountId: s.defaultCashAccountId,
    approvalRequired: s.approvalRequired,
    receiptRequired: s.receiptRequired,
    maxExpenseLimit: s.maxExpenseLimit?.toFixed(2) ?? null,
  };
}

/** Timezone/currency are needed by every signed-in screen (not permission-gated). */
export async function getCompanyLocale(companyId: string) {
  const s = await settingsRepository.get(companyId);
  return { timezone: s.timezone, currency: s.currency };
}

export async function getCompanySettings(auth: AuthContext): Promise<CompanySettingsDTO> {
  if (!auth.permissions.has("settings.read") && !auth.permissions.has("company.read")) throw Errors.forbidden();
  return toSettingsDTO(await settingsRepository.get(auth.companyId));
}

export async function updateCompanySettings(
  auth: AuthContext,
  input: z.output<typeof updateSettingsSchema>,
  meta: RequestMeta,
): Promise<CompanySettingsDTO> {
  assertPermission(auth, "settings.update");
  const before = await settingsRepository.get(auth.companyId);

  if (input.defaultCashAccountId) {
    const account = await cashAccountRepository.findById(auth.companyId, input.defaultCashAccountId);
    if (!account || !account.isActive) {
      throw Errors.validation({ defaultCashAccountId: ["Choose an active cash account"] });
    }
  }

  const data: Prisma.CompanySettingsUncheckedUpdateInput = {};
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.financialYearStartMonth !== undefined) data.financialYearStartMonth = input.financialYearStartMonth;
  if (input.defaultCashAccountId !== undefined) data.defaultCashAccountId = input.defaultCashAccountId;
  if (input.approvalRequired !== undefined) data.approvalRequired = input.approvalRequired;
  if (input.receiptRequired !== undefined) data.receiptRequired = input.receiptRequired;
  if (input.maxExpenseLimit !== undefined) {
    data.maxExpenseLimit = input.maxExpenseLimit === null ? null : new Prisma.Decimal(input.maxExpenseLimit);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await settingsRepository.update(auth.companyId, data, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.settingsChanged,
        entityType: "company_settings",
        entityId: auth.companyId,
        oldValues: toSettingsDTO(before) as unknown as Prisma.InputJsonValue,
        newValues: toSettingsDTO(row) as unknown as Prisma.InputJsonValue,
        meta,
      },
      tx,
    );
    return row;
  });
  return toSettingsDTO(updated);
}

export async function renameCompany(auth: AuthContext, input: z.output<typeof updateCompanySchema>, meta: RequestMeta) {
  assertPermission(auth, "company.update");
  await prisma.$transaction(async (tx) => {
    await settingsRepository.renameCompany(auth.companyId, input.name, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.companyUpdated,
        entityType: "company",
        entityId: auth.companyId,
        oldValues: { name: auth.company.name },
        newValues: { name: input.name },
        meta,
      },
      tx,
    );
  });
}

/** The subset of settings the entry form needs; available to anyone who can record entries. */
export async function getEntryFormSettings(auth: AuthContext) {
  if (!auth.permissions.has("transactions.create") && !auth.permissions.has("transactions.update")) throw Errors.forbidden();
  const s = await settingsRepository.get(auth.companyId);
  return {
    approvalRequired: s.approvalRequired,
    timezone: s.timezone,
    currency: s.currency,
    defaultCashAccountId: s.defaultCashAccountId,
    maxExpenseLimit: s.maxExpenseLimit?.toFixed(2) ?? null,
  };
}
