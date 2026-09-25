import type { EntryTypeValue } from "@/config/entries";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Amount with fintech conventions: money in (+) is green, money out is neutral ink,
 * adjustments carry their sign. Colour is never the only cue — the sign is always shown for inflows.
 */
export function Money({
  amount,
  currency = "INR",
  type,
  className,
}: {
  amount: string | number;
  currency?: string;
  type?: EntryTypeValue;
  className?: string;
}) {
  const value = Number(amount);
  const abs = formatCurrency(Math.abs(value), currency);
  const inflow = type === "income" || (type === "adjustment" && value > 0);
  const outflowAdjustment = type === "adjustment" && value < 0;
  return (
    <span className={cn("text-amount whitespace-nowrap", inflow && "text-success", className)}>
      {inflow ? `+${abs}` : outflowAdjustment ? `−${abs}` : abs}
    </span>
  );
}
