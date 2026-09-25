"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { applyServerErrors } from "@/components/forms/form-utils";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { CURRENCIES, MONTHS, TIMEZONES } from "@/config/entries";
import { useCashAccounts, useReferenceMutations } from "@/hooks/use-reference-data";
import { api, errorMessage } from "@/lib/api-client";
import type { CompanySettingsDTO } from "@/types/dto";
import { updateSettingsSchema } from "@/validators/company.schema";

/** Company name lives on the company (company.update); everything else is settings (settings.update). */
const formSchema = updateSettingsSchema.extend({ companyName: z.string().trim().min(2, "Company name must be at least 2 characters").max(120) });

export function CompanySettingsForm({ settings }: { settings: CompanySettingsDTO }) {
  const me = useSession();
  const router = useRouter();
  const { updateSettings } = useReferenceMutations();
  const { data: accounts } = useCashAccounts({ activeOnly: true });
  const canEditSettings = me.can("settings.update");
  const canRename = me.can("company.update");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: settings.companyName,
      currency: settings.currency,
      timezone: settings.timezone as (typeof TIMEZONES)[number],
      financialYearStartMonth: settings.financialYearStartMonth,
      defaultCashAccountId: settings.defaultCashAccountId,
      approvalRequired: settings.approvalRequired,
      receiptRequired: settings.receiptRequired,
      maxExpenseLimit: settings.maxExpenseLimit ?? "",
    },
  });
  const { control, register, handleSubmit, setError, reset, formState } = form;
  const errors = formState.errors;

  const onSubmit = handleSubmit(async ({ companyName, ...values }) => {
    try {
      if (canRename && companyName !== settings.companyName) {
        await api("/api/company", { method: "PATCH", body: { name: companyName } });
      }
      if (canEditSettings) await updateSettings.mutateAsync(values);
      toast.success("Settings saved ✓");
      reset(form.getValues());
      router.refresh();
    } catch (error) {
      if (!applyServerErrors(error, setError, ["currency", "timezone", "financialYearStartMonth", "defaultCashAccountId", "maxExpenseLimit"])) {
        toast.error(errorMessage(error));
      }
    }
  });

  const readOnly = !canEditSettings && !canRename;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset disabled={readOnly} className="contents">
        <FieldGroup className="max-w-2xl">
          <Field data-invalid={!!errors.companyName}>
            <FieldLabel htmlFor="companyName">Company name</FieldLabel>
            <Input id="companyName" disabled={!canRename} aria-invalid={!!errors.companyName} {...register("companyName")} />
            {!canRename && <FieldDescription>Only the owner can rename the company.</FieldDescription>}
            <FieldError errors={[errors.companyName]} />
          </Field>

          <FieldSeparator />

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="currency">Currency</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!canEditSettings}>
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="timezone"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!canEditSettings}>
                    <SelectTrigger id="timezone" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>Decides what &ldquo;today&rdquo; and &ldquo;this month&rdquo; mean.</FieldDescription>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="financialYearStartMonth"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="fy">Financial year starts</FieldLabel>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))} disabled={!canEditSettings}>
                    <SelectTrigger id="fy" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="defaultCashAccountId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="defaultAccount">Default cash account</FieldLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={!canEditSettings}>
                    <SelectTrigger id="defaultAccount" className="w-full">
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {(accounts ?? []).map((a) => (
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
          </div>

          <FieldSeparator />

          <Controller
            control={control}
            name="approvalRequired"
            render={({ field }) => (
              <Field orientation="horizontal" className="justify-between">
                <div>
                  <FieldLabel htmlFor="approvalRequired">Approval required</FieldLabel>
                  <FieldDescription>Entries wait for an accountant or admin before they change the balance.</FieldDescription>
                </div>
                <Switch id="approvalRequired" checked={field.value} onCheckedChange={field.onChange} disabled={!canEditSettings} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="receiptRequired"
            render={({ field }) => (
              <Field orientation="horizontal" className="justify-between">
                <div>
                  <FieldLabel htmlFor="receiptRequired">Receipt required</FieldLabel>
                  <FieldDescription>Expenses can&apos;t be submitted without an attached receipt or screenshot.</FieldDescription>
                </div>
                <Switch id="receiptRequired" checked={field.value} onCheckedChange={field.onChange} disabled={!canEditSettings} />
              </Field>
            )}
          />
          <Field data-invalid={!!errors.maxExpenseLimit}>
            <FieldLabel htmlFor="maxExpenseLimit">Maximum per expense (₹)</FieldLabel>
            <Input
              id="maxExpenseLimit"
              inputMode="decimal"
              placeholder="No limit"
              className="max-w-48"
              disabled={!canEditSettings}
              aria-invalid={!!errors.maxExpenseLimit}
              {...register("maxExpenseLimit")}
            />
            <FieldDescription>Larger expenses must go through your regular purchase process.</FieldDescription>
            <FieldError errors={[errors.maxExpenseLimit]} />
          </Field>
        </FieldGroup>
      </fieldset>

      {!readOnly && (
        <Button type="submit" disabled={formState.isSubmitting || !formState.isDirty}>
          {formState.isSubmitting && <Spinner />}
          Save settings
        </Button>
      )}
    </form>
  );
}
