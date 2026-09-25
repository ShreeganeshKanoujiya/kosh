import { z } from "zod";
import { CURRENCIES, TIMEZONES } from "@/config/entries";
import { amountSchema } from "./entry.schema";
import { idSchema } from "./common";

const currencyCodes = CURRENCIES.map((c) => c.code) as [string, ...string[]];

export const updateCompanySchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters").max(120),
});

export const updateSettingsSchema = z.object({
  currency: z.enum(currencyCodes).optional(),
  timezone: z.enum(TIMEZONES).optional(),
  financialYearStartMonth: z.number().int().min(1).max(12).optional(),
  defaultCashAccountId: idSchema.optional().nullable(),
  approvalRequired: z.boolean().optional(),
  receiptRequired: z.boolean().optional(),
  /** "" / null clears the limit. */
  maxExpenseLimit: z
    .union([z.literal(""), z.null(), amountSchema])
    .optional()
    .transform((v) => (v === undefined ? undefined : v ? v : null)),
});
export type UpdateSettingsInput = z.input<typeof updateSettingsSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.input<typeof categorySchema>;
export const updateCategorySchema = categorySchema.partial();

/** Opening balance may be zero; negative is not allowed. */
const openingBalanceSchema = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim().replace(/[,\s₹]/g, "") || "0")
  .pipe(z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter a valid amount"));

export const cashAccountSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  openingBalance: openingBalanceSchema.default("0"),
  currency: z.enum(currencyCodes).default("INR"),
  isActive: z.boolean().default(true),
});
export type CashAccountInput = z.input<typeof cashAccountSchema>;
export const updateCashAccountSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  openingBalance: openingBalanceSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCashAccountInput = z.input<typeof updateCashAccountSchema>;
