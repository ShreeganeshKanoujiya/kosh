import { z } from "zod";
import { ENTRY_SOURCES, ENTRY_STATUSES, ENTRY_TYPES, PAYMENT_METHODS } from "@/config/entries";
import { idSchema, paginationSchema } from "./common";

/** Positive amount with at most 2 decimals, max 99,99,99,99,999.99 (Decimal(14,2)). Accepts "1,250.50". */
export const amountSchema = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim().replace(/[,\s₹]/g, ""))
  .pipe(z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter a valid amount (up to 2 decimals)"))
  .refine((v) => Number(v) > 0, "Amount must be greater than 0");

export const ymdSchema = z.iso.date("Enter a valid date");
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

// VPA format: handle@psp (e.g. abc@okaxis, 98xxxxxx@ybl)
const upiIdSchema = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/, "Enter a valid UPI ID (e.g. name@okaxis)")
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const entryFields = {
  type: z.enum(ENTRY_TYPES),
  /** Adjustments only: whether the adjustment increases or decreases the balance. */
  adjustmentDirection: z.enum(["increase", "decrease"]).optional().nullable(),
  amount: amountSchema,
  entryDate: ymdSchema,
  entryTime: timeSchema.optional().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
  categoryId: idSchema.optional().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
  description: optionalText(500),
  paymentMethod: z.enum(PAYMENT_METHODS),
  merchantName: optionalText(120),
  upiId: upiIdSchema,
  transactionId: optionalText(64),
  referenceNumber: optionalText(64),
  cashAccountId: idSchema.optional().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
};

function refineEntry(d: { type: string; categoryId?: string | null; adjustmentDirection?: string | null }, ctx: z.RefinementCtx) {
  if (d.type === "expense" && !d.categoryId) {
    ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Choose a category" });
  }
  if (d.type === "adjustment" && !d.adjustmentDirection) {
    ctx.addIssue({ code: "custom", path: ["adjustmentDirection"], message: "Choose increase or decrease" });
  }
}

export const createEntrySchema = z
  .object({
    ...entryFields,
    type: entryFields.type.default("expense"),
    source: z.enum(ENTRY_SOURCES).default("manual"),
    /** Save and submit in one step. */
    submit: z.boolean().default(false),
    /** Set after the user confirms a possible duplicate. */
    allowDuplicate: z.boolean().default(false),
  })
  .superRefine(refineEntry);
export type CreateEntryInput = z.input<typeof createEntrySchema>;
export type CreateEntryData = z.output<typeof createEntrySchema>;

export const updateEntrySchema = z
  .object({
    ...entryFields,
    version: z.number().int().positive(),
  })
  .superRefine(refineEntry);
export type UpdateEntryInput = z.input<typeof updateEntrySchema>;

export const versionSchema = z.object({ version: z.number().int().positive() });

export const rejectEntrySchema = z.object({
  version: z.number().int().positive(),
  reason: z.string().trim().min(3, "Tell the submitter why (at least 3 characters)").max(500),
});

const csv = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .transform((v) => v.split(",").filter(Boolean))
    .pipe(z.array(z.enum(values)).max(values.length));

export const listEntriesQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  from: ymdSchema.optional(),
  to: ymdSchema.optional(),
  status: csv(ENTRY_STATUSES).optional(),
  type: z.enum(ENTRY_TYPES).optional(),
  categoryId: idSchema.optional(),
  userId: idSchema.optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  source: z.enum(ENTRY_SOURCES).optional(),
  cashAccountId: idSchema.optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc"]).default("date_desc"),
});
export type ListEntriesQuery = z.output<typeof listEntriesQuerySchema>;
