"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  ENTRY_SOURCES,
  ENTRY_STATUSES,
  ENTRY_TYPE_LABELS,
  ENTRY_TYPES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "@/config/entries";
import { useCashAccounts, useCategories, useUserOptions } from "@/hooks/use-reference-data";
import { useIsDesktop } from "@/hooks/use-media-query";
import type { EntryQuery } from "@/hooks/use-entries";

const ANY = "any";

/** Filter keys handled by the sheet (search, dates and sort live elsewhere). */
export const SHEET_FILTER_KEYS = ["status", "type", "categoryId", "userId", "paymentMethod", "source", "cashAccountId", "minAmount", "maxAmount"] as const;

function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value ?? ANY} onValueChange={(v) => onChange(v === ANY ? undefined : v)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function TransactionFilters({
  query,
  onApply,
}: {
  query: EntryQuery;
  onApply: (patch: Partial<EntryQuery>) => void;
}) {
  const me = useSession();
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EntryQuery>(query);
  const { data: categories } = useCategories();
  const { data: accounts } = useCashAccounts();
  const { data: users } = useUserOptions(me.can("users.read"));

  const active = SHEET_FILTER_KEYS.filter((k) => query[k]).length;
  const set = (key: string, value: string | undefined) => setDraft((d) => ({ ...d, [key]: value ?? "" }));
  const statuses = new Set((draft.status ?? "").split(",").filter(Boolean));

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(query);
        setOpen(o);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" className="relative shrink-0">
          <SlidersHorizontal />
          Filters
          {active > 0 && (
            <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold text-primary-foreground">
              {active}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={isDesktop ? "right" : "bottom"} className="flex max-h-[92dvh] flex-col gap-0 sm:max-w-md md:max-h-none">
        <SheetHeader className="border-b">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down transactions. Filters apply to exports too.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="f-from">From</FieldLabel>
              <Input id="f-from" type="date" value={draft.from ?? ""} max={draft.to || undefined} onChange={(e) => set("from", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="f-to">To</FieldLabel>
              <Input id="f-to" type="date" value={draft.to ?? ""} min={draft.from || undefined} onChange={(e) => set("to", e.target.value)} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Status</legend>
            <div className="grid grid-cols-2 gap-2">
              {ENTRY_STATUSES.map((s) => (
                <label key={s} className="flex min-h-10 items-center gap-2.5 rounded-lg border px-3 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent">
                  <Checkbox
                    checked={statuses.has(s)}
                    onCheckedChange={(v) => {
                      const next = new Set(statuses);
                      if (v === true) next.add(s);
                      else next.delete(s);
                      set("status", [...next].join(","));
                    }}
                  />
                  {STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>

          <SelectFilter
            id="f-category"
            label="Category"
            value={draft.categoryId}
            onChange={(v) => set("categoryId", v)}
            options={(categories ?? []).map((c) => ({ value: c.id, label: c.isActive ? c.name : `${c.name} (inactive)` }))}
          />
          {me.can("users.read") && (
            <SelectFilter
              id="f-user"
              label="Created by"
              value={draft.userId}
              onChange={(v) => set("userId", v)}
              options={(users ?? []).map((u) => ({ value: u.id, label: `${u.fullName} (@${u.username})` }))}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <SelectFilter
              id="f-payment"
              label="Payment method"
              value={draft.paymentMethod}
              onChange={(v) => set("paymentMethod", v)}
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))}
            />
            <SelectFilter
              id="f-type"
              label="Type"
              value={draft.type}
              onChange={(v) => set("type", v)}
              options={ENTRY_TYPES.map((t) => ({ value: t, label: ENTRY_TYPE_LABELS[t] }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectFilter
              id="f-source"
              label="Source"
              value={draft.source}
              onChange={(v) => set("source", v)}
              options={ENTRY_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
            />
            {(accounts?.length ?? 0) > 1 && (
              <SelectFilter
                id="f-account"
                label="Cash account"
                value={draft.cashAccountId}
                onChange={(v) => set("cashAccountId", v)}
                options={(accounts ?? []).map((a) => ({ value: a.id, label: a.name }))}
              />
            )}
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Amount (₹)</legend>
            <div className="grid grid-cols-2 gap-3">
              <Input inputMode="decimal" placeholder="Min" aria-label="Minimum amount" value={draft.minAmount ?? ""} onChange={(e) => set("minAmount", e.target.value.replace(/[^\d.]/g, ""))} />
              <Input inputMode="decimal" placeholder="Max" aria-label="Maximum amount" value={draft.maxAmount ?? ""} onChange={(e) => set("maxAmount", e.target.value.replace(/[^\d.]/g, ""))} />
            </div>
          </fieldset>
        </div>
        <SheetFooter className="flex-row gap-2 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              onApply(Object.fromEntries([...SHEET_FILTER_KEYS, "from", "to"].map((k) => [k, ""])));
              setOpen(false);
            }}
          >
            Reset
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onApply(Object.fromEntries([...SHEET_FILTER_KEYS, "from", "to"].map((k) => [k, draft[k] ?? ""])));
              setOpen(false);
            }}
          >
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
