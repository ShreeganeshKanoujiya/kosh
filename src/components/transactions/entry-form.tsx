"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ChipGroup } from "@/components/forms/chip-group";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_METHODS, type EntryTypeValue } from "@/config/entries";
import { useEntryMutations } from "@/hooks/use-entries";
import { ApiClientError, errorMessage } from "@/lib/api-client";
import { hmInTimeZone, todayYmd } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CashAccountDTO, CategoryDTO, DuplicateCandidateDTO, EntryDTO } from "@/types/dto";
import { createEntrySchema, type CreateEntryInput } from "@/validators/entry.schema";
import { DuplicateDialog } from "./duplicate-dialog";

export interface EntryFormSettings {
  approvalRequired: boolean;
  timezone: string;
  currency: string;
  defaultCashAccountId: string | null;
  maxExpenseLimit: string | null;
}

const FIELDS = [
  "type",
  "adjustmentDirection",
  "amount",
  "entryDate",
  "entryTime",
  "categoryId",
  "description",
  "paymentMethod",
  "merchantName",
  "upiId",
  "transactionId",
  "referenceNumber",
  "cashAccountId",
] as const;

function defaultsFor(entry: EntryDTO | undefined, settings: EntryFormSettings): CreateEntryInput {
  if (entry) {
    const amount = Number(entry.amount);
    return {
      type: entry.type,
      adjustmentDirection: entry.type === "adjustment" ? (amount < 0 ? "decrease" : "increase") : null,
      amount: Math.abs(amount).toFixed(2),
      entryDate: entry.entryDate,
      entryTime: entry.entryTime ?? "",
      categoryId: entry.category?.id ?? "",
      description: entry.description ?? "",
      paymentMethod: entry.paymentMethod,
      merchantName: entry.merchantName ?? "",
      upiId: entry.upiId ?? "",
      transactionId: entry.transactionId ?? "",
      referenceNumber: entry.referenceNumber ?? "",
      cashAccountId: entry.cashAccount.id,
    };
  }
  const now = new Date();
  return {
    type: "expense",
    adjustmentDirection: null,
    amount: "",
    entryDate: todayYmd(settings.timezone),
    entryTime: hmInTimeZone(now, settings.timezone),
    categoryId: "",
    description: "",
    paymentMethod: "cash",
    merchantName: "",
    upiId: "",
    transactionId: "",
    referenceNumber: "",
    cashAccountId: settings.defaultCashAccountId ?? "",
  };
}

export function EntryForm({
  entry,
  categories,
  cashAccounts,
  settings,
  canAdjust,
  notice,
}: {
  /** Present = edit mode. */
  entry?: EntryDTO;
  categories: CategoryDTO[];
  cashAccounts: CashAccountDTO[];
  settings: EntryFormSettings;
  canAdjust: boolean;
  notice?: string;
}) {
  const router = useRouter();
  const { create, update, transition } = useEntryMutations();
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidateDTO[] | null>(null);
  const [pendingValues, setPendingValues] = useState<CreateEntryInput | null>(null);
  const initial = defaultsFor(entry, settings);
  const [showMore, setShowMore] = useState(
    Boolean(initial.merchantName || initial.upiId || initial.transactionId || initial.referenceNumber),
  );

  const form = useForm({ resolver: zodResolver(createEntrySchema), defaultValues: initial });
  const { control, register, handleSubmit, setError, setValue, formState } = form;
  const [type, paymentMethod, amountText] = useWatch({ control, name: ["type", "paymentMethod", "amount"] });
  const errors = formState.errors;

  // Keep a now-inactive category selectable on an entry that already uses it.
  const categoryOptions = [...categories.filter((c) => c.isActive)];
  if (entry?.category && !categoryOptions.some((c) => c.id === entry.category!.id)) {
    categoryOptions.unshift({ id: entry.category.id, name: entry.category.name, description: null, isActive: false, entryCount: 0 });
  }
  const activeAccounts = cashAccounts.filter((a) => a.isActive || a.id === entry?.cashAccount.id);
  const canSubmit = !entry || entry.allowedActions.includes("submit");
  const submitLabel = settings.approvalRequired ? "Save & submit" : "Save";

  const typeOptions = (["expense", "income", "adjustment"] as EntryTypeValue[])
    .filter((t) => t !== "adjustment" || canAdjust || entry?.type === "adjustment")
    .map((t) => ({ value: t, label: ENTRY_TYPE_LABELS[t] }));

  async function persist(values: CreateEntryInput) {
    setFormError(null);
    try {
      if (entry) {
        // Only the editable fields go on an update (no create-only flags).
        const fields = Object.fromEntries(FIELDS.map((k) => [k, values[k]])) as Omit<CreateEntryInput, "submit" | "allowDuplicate" | "source">;
        const { data } = await update.mutateAsync({
          id: entry.id,
          input: { ...fields, type: fields.type ?? entry.type, version: entry.version },
        });
        let result = data;
        if (values.submit && data.allowedActions.includes("submit")) {
          result = (await transition.mutateAsync({ id: data.id, action: "submit", version: data.version })).data;
        }
        toast.success(values.submit ? "Transaction submitted ✓" : "Transaction updated ✓");
        router.replace(`/transactions/${result.id}`);
      } else {
        const { data } = await create.mutateAsync(values);
        toast.success(data.status === "draft" ? "Draft saved ✓" : "Transaction created ✓", {
          description: `${data.entryNumber} · ${formatCurrency(Math.abs(Number(data.amount)), data.currency)}`,
          action: { label: "Add another", onClick: () => router.push("/transactions/new?mode=manual") },
        });
        router.replace(`/transactions/${data.id}`);
      }
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "POSSIBLE_DUPLICATE") {
        setPendingValues(values);
        setDuplicates((error.details as { duplicates: DuplicateCandidateDTO[] }).duplicates);
        return;
      }
      if (error instanceof ApiClientError && error.code === "VERSION_CONFLICT") {
        toast.error(error.message, { action: { label: "Reload", onClick: () => router.refresh() } });
        return;
      }
      if (applyServerErrors(error, setError, FIELDS)) return;
      setFormError(errorMessage(error, "Unable to save transaction. Please try again."));
    }
  }

  const save = (submit: boolean) =>
    handleSubmit((values) => persist({ ...values, submit }), () => setFormError(null));

  const busy = formState.isSubmitting || create.isPending || update.isPending || transition.isPending;

  return (
    <>
      <form onSubmit={save(canSubmit)} noValidate className="mx-auto max-w-2xl pb-24 md:pb-0">
        <Card className="gap-6 p-5 md:p-7">
          {notice && <FormAlert tone="info" message={notice} />}
          <FormAlert message={formError} />

          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <ChipGroup
                variant="segmented"
                label="Transaction type"
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  if (v === "adjustment") setValue("adjustmentDirection", "decrease");
                }}
                options={typeOptions}
              />
            )}
          />

          {/* Amount — the hero field */}
          <Field data-invalid={!!errors.amount}>
            <FieldLabel htmlFor="amount" className="sr-only">
              Amount
            </FieldLabel>
            <div className="flex items-baseline justify-center gap-1 py-2">
              <span className="text-3xl font-semibold text-muted-foreground" aria-hidden>
                ₹
              </span>
              <input
                id="amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                aria-invalid={!!errors.amount}
                autoFocus={!entry}
                {...register("amount")}
                style={{ width: `${Math.min(14, Math.max(1, String(amountText ?? "").length)) + 0.4}ch` }}
                className="max-w-full bg-transparent text-5xl font-semibold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            {settings.maxExpenseLimit && type === "expense" && (
              <FieldDescription className="text-center">
                Limit per expense: {formatCurrency(settings.maxExpenseLimit, settings.currency)}
              </FieldDescription>
            )}
            <FieldError className="text-center" errors={[errors.amount]} />
          </Field>

          {type === "adjustment" && (
            <Controller
              control={control}
              name="adjustmentDirection"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Adjustment</FieldLabel>
                  <ChipGroup
                    label="Adjustment direction"
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                    options={[
                      { value: "increase", label: "Increase balance", icon: <Plus className="size-4" /> },
                      { value: "decrease", label: "Decrease balance", icon: <Minus className="size-4" /> },
                    ]}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          )}

          <FieldGroup>
            <Controller
              control={control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel id="category-label">
                    Category{type !== "expense" && <span className="font-normal text-muted-foreground"> (optional)</span>}
                  </FieldLabel>
                  <ChipGroup
                    label="Category"
                    scroll
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                    options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Paid by</FieldLabel>
                  <ChipGroup
                    label="Payment method"
                    scroll
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      if (v !== "cash") setShowMore(true);
                    }}
                    options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))}
                  />
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.entryDate}>
                <FieldLabel htmlFor="entryDate">Date</FieldLabel>
                <Input
                  id="entryDate"
                  type="date"
                  max={todayYmd(settings.timezone)}
                  aria-invalid={!!errors.entryDate}
                  {...register("entryDate")}
                />
                <FieldError errors={[errors.entryDate]} />
              </Field>
              <Field data-invalid={!!errors.entryTime}>
                <FieldLabel htmlFor="entryTime">Time</FieldLabel>
                <Input id="entryTime" type="time" aria-invalid={!!errors.entryTime} {...register("entryTime")} />
                <FieldError errors={[errors.entryTime]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Input
                id="description"
                placeholder={type === "income" ? "e.g. Petty cash top-up from bank" : "e.g. Printer paper, 2 reams"}
                autoComplete="off"
                aria-invalid={!!errors.description}
                {...register("description")}
              />
              <FieldError errors={[errors.description]} />
            </Field>
          </FieldGroup>

          <div className="rounded-xl border">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              aria-controls="more-details"
              className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-medium"
            >
              More details
              <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                Merchant, UPI ID, reference
                <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} aria-hidden />
              </span>
            </button>
            {showMore && (
              <FieldGroup id="more-details" className="border-t p-4">
                <Field data-invalid={!!errors.merchantName}>
                  <FieldLabel htmlFor="merchantName">Merchant / paid to</FieldLabel>
                  <Input id="merchantName" placeholder="ABC Stationery" autoComplete="off" aria-invalid={!!errors.merchantName} {...register("merchantName")} />
                  <FieldError errors={[errors.merchantName]} />
                </Field>
                {(paymentMethod === "upi" || entry?.upiId) && (
                  <Field data-invalid={!!errors.upiId}>
                    <FieldLabel htmlFor="upiId">UPI ID</FieldLabel>
                    <Input id="upiId" placeholder="name@okaxis" autoCapitalize="none" autoComplete="off" spellCheck={false} aria-invalid={!!errors.upiId} {...register("upiId")} />
                    <FieldError errors={[errors.upiId]} />
                  </Field>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.transactionId}>
                    <FieldLabel htmlFor="transactionId">Transaction ID / UTR</FieldLabel>
                    <Input id="transactionId" autoComplete="off" spellCheck={false} aria-invalid={!!errors.transactionId} {...register("transactionId")} />
                    <FieldError errors={[errors.transactionId]} />
                  </Field>
                  <Field data-invalid={!!errors.referenceNumber}>
                    <FieldLabel htmlFor="referenceNumber">Bill / reference no.</FieldLabel>
                    <Input id="referenceNumber" autoComplete="off" aria-invalid={!!errors.referenceNumber} {...register("referenceNumber")} />
                    <FieldError errors={[errors.referenceNumber]} />
                  </Field>
                </div>
                {activeAccounts.length > 1 && (
                  <Controller
                    control={control}
                    name="cashAccountId"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cashAccountId">Cash account</FieldLabel>
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <SelectTrigger id="cashAccountId" className="w-full">
                            <SelectValue placeholder="Choose an account" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeAccounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                )}
              </FieldGroup>
            )}
          </div>
          <FieldError errors={[errors.cashAccountId]} />
        </Card>

        {/* Actions: sticky above the tab bar on phones, inline on larger screens */}
        <div className="fixed inset-x-0 bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] z-30 border-t bg-background/90 px-4 py-3 backdrop-blur-md md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto flex max-w-2xl gap-3 md:justify-end">
            {(!entry || entry.status === "draft" || entry.status === "rejected") && (
              <Button type="button" variant="secondary" className="flex-1 md:flex-none" disabled={busy} onClick={save(false)}>
                {entry ? "Save changes" : "Save draft"}
              </Button>
            )}
            {canSubmit ? (
              <Button type="submit" className="flex-[2] md:flex-none" disabled={busy}>
                {busy && <Spinner />}
                {entry ? (settings.approvalRequired ? "Save & submit" : "Save & record") : submitLabel}
              </Button>
            ) : (
              <Button type="button" className="flex-[2] md:flex-none" disabled={busy} onClick={save(false)}>
                {busy && <Spinner />}
                Save changes
              </Button>
            )}
          </div>
        </div>
      </form>

      <DuplicateDialog
        duplicates={duplicates}
        saving={create.isPending}
        onCancel={() => setDuplicates(null)}
        onSaveAnyway={async () => {
          const values = pendingValues;
          setDuplicates(null);
          setPendingValues(null);
          if (values) await persist({ ...values, allowDuplicate: true });
        }}
      />
    </>
  );
}
