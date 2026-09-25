"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export interface ChipOption<V extends string> {
  value: V;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Single-choice chips (radio semantics: arrow keys move, one tab stop).
 * `variant="segmented"` renders an iOS-style segmented control.
 */
export function ChipGroup<V extends string>({
  value,
  onChange,
  options,
  label,
  variant = "chips",
  scroll = false,
  invalid,
  className,
  id,
}: {
  value: V | null | undefined;
  onChange: (value: V) => void;
  options: ChipOption<V>[];
  label: string;
  variant?: "chips" | "segmented";
  /** Single horizontally-scrolling row on small screens. */
  scroll?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
}) {
  const segmented = variant === "segmented";
  return (
    <RadioGroupPrimitive.Root
      id={id}
      value={value ?? ""}
      onValueChange={(v) => onChange(v as V)}
      aria-label={label}
      aria-invalid={invalid || undefined}
      orientation="horizontal"
      className={cn(
        segmented ? "grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1" : "flex gap-2",
        !segmented && (scroll ? "-mx-1 flex-nowrap overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible" : "flex-wrap"),
        className,
      )}
    >
      {options.map((o) => (
        <RadioGroupPrimitive.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40",
            segmented
              ? "h-10 rounded-lg px-3 text-muted-foreground data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:shadow-xs md:h-9"
              : "h-10 rounded-full border bg-card px-4 text-foreground hover:bg-muted data-[state=checked]:border-primary data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground md:h-9",
            invalid && !segmented && "border-destructive/50",
          )}
        >
          {o.icon}
          {o.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
