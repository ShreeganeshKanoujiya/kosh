import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { EntryType } from "@/generated/prisma/enums";

export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

/** Money leaves the server as a fixed 2-dp string — never a float. */
export function money(value: Prisma.Decimal | null | undefined): string {
  return (value ?? new Prisma.Decimal(0)).toFixed(2);
}

/**
 * Effect of an approved entry on the cash balance.
 * Expenses reduce it, income increases it, adjustments carry their own sign.
 */
export function balanceDelta(type: EntryType, amount: Prisma.Decimal): Prisma.Decimal {
  return type === "expense" ? amount.negated() : amount;
}
