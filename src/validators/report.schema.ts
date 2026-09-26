import { z } from "zod";
import { ENTRY_STATUSES, PAYMENT_METHODS } from "@/config/entries";
import { idSchema } from "./common";
import { ymdSchema } from "./entry.schema";

export const REPORT_TYPES = [
  "daily",
  "weekly",
  "monthly",
  "category",
  "user",
  "payment_method",
  "cash_account",
  "approval",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_LABELS: Record<ReportType, { title: string; description: string }> = {
  daily: { title: "Daily expenses", description: "Spend and cash added per day" },
  weekly: { title: "Weekly expenses", description: "Totals per week (Monday start)" },
  monthly: { title: "Monthly expenses", description: "Totals per calendar month" },
  category: { title: "By category", description: "Where the money went" },
  user: { title: "By user", description: "Who recorded what" },
  payment_method: { title: "By payment method", description: "Cash vs UPI vs card" },
  cash_account: { title: "Cash accounts", description: "Movement and balance per account" },
  approval: { title: "Approvals", description: "Review throughput per approver" },
};

/**
 * "approved" = accounting view (what moved the balance).
 * "recorded" = everything submitted, including entries still awaiting review.
 */
export const reportBasisSchema = z.enum(["approved", "recorded"]);

export const reportQuerySchema = z
  .object({
    type: z.enum(REPORT_TYPES),
    from: ymdSchema,
    to: ymdSchema,
    basis: reportBasisSchema.default("approved"),
    categoryId: idSchema.optional(),
    userId: idSchema.optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    cashAccountId: idSchema.optional(),
    status: z
      .string()
      .transform((v) => v.split(",").filter(Boolean))
      .pipe(z.array(z.enum(ENTRY_STATUSES)))
      .optional(),
  })
  .refine((q) => q.from <= q.to, { path: ["to"], message: "End date must be on or after the start date" })
  .refine(
    (q) => (new Date(`${q.to}T00:00:00Z`).getTime() - new Date(`${q.from}T00:00:00Z`).getTime()) / 86_400_000 <= 1_100,
    { path: ["from"], message: "Choose a range of up to 3 years" },
  );
export type ReportQuery = z.output<typeof reportQuerySchema>;
