"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/common/responsive-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useCashAccounts, useReferenceMutations } from "@/hooks/use-reference-data";
import { errorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CashAccountDTO } from "@/types/dto";
import { cashAccountSchema } from "@/validators/company.schema";

export function CashAccountsView({ initialData }: { initialData: CashAccountDTO[] }) {
  const me = useSession();
  const { data = initialData } = useCashAccounts();
  const [editing, setEditing] = useState<CashAccountDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const canManage = me.can("cash_accounts.manage");

  return (
    <div className="space-y-4">
      {canManage && (
        <Button onClick={() => setCreating(true)} className="max-sm:w-full">
          <Plus />
          New cash account
        </Button>
      )}
      <ul className="divide-y rounded-xl border">
        {data.map((a) => (
          <li key={a.id} className={cn("flex items-center gap-3 px-4 py-3", !a.isActive && "opacity-70")}>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Wallet className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {a.name}
                {a.isDefault && <StatusBadge tone="primary">Default</StatusBadge>}
                {!a.isActive && <StatusBadge>Inactive</StatusBadge>}
              </p>
              <p className="text-caption">Opening balance {formatCurrency(a.openingBalance, a.currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-amount">{formatCurrency(a.currentBalance, a.currency)}</p>
              <p className="text-meta">Current balance</p>
            </div>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                Edit
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-caption">
        Current balance = opening balance + approved cash added − approved expenses ± approved adjustments. It&apos;s
        maintained by the server and can&apos;t be edited directly.
      </p>

      <ResponsiveDialog open={creating} onOpenChange={setCreating} title="New cash account">
        <AccountForm onDone={() => setCreating(false)} />
      </ResponsiveDialog>
      <ResponsiveDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={`Edit ${editing?.name ?? ""}`}>
        {editing && <AccountForm account={editing} onDone={() => setEditing(null)} />}
      </ResponsiveDialog>
    </div>
  );
}

function AccountForm({ account, onDone }: { account?: CashAccountDTO; onDone: () => void }) {
  const { createCashAccount, updateCashAccount } = useReferenceMutations();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(cashAccountSchema),
    defaultValues: {
      name: account?.name ?? "",
      openingBalance: account?.openingBalance ?? "0",
      currency: account?.currency ?? "INR",
      isActive: account?.isActive ?? true,
    },
  });
  const { register, handleSubmit, control, setError, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (account) {
        await updateCashAccount.mutateAsync({
          id: account.id,
          input: { name: values.name, openingBalance: values.openingBalance, isActive: values.isActive },
        });
      } else {
        await createCashAccount.mutateAsync(values);
      }
      toast.success(account ? "Cash account updated ✓" : "Cash account created ✓");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, ["name", "openingBalance", "isActive"])) setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="contents">
      <ResponsiveDialogBody className="space-y-5">
        <FormAlert message={formError} />
        <FieldGroup>
          <Field data-invalid={!!formState.errors.name}>
            <FieldLabel htmlFor="acct-name">Name</FieldLabel>
            <Input id="acct-name" autoFocus placeholder="e.g. Branch office cash" aria-invalid={!!formState.errors.name} {...register("name")} />
            <FieldError errors={[formState.errors.name]} />
          </Field>
          <Field data-invalid={!!formState.errors.openingBalance}>
            <FieldLabel htmlFor="acct-opening">Opening balance (₹)</FieldLabel>
            <Input id="acct-opening" inputMode="decimal" aria-invalid={!!formState.errors.openingBalance} {...register("openingBalance")} />
            {account && <FieldDescription>Changing this recalculates the current balance from all approved entries.</FieldDescription>}
            <FieldError errors={[formState.errors.openingBalance]} />
          </Field>
          <Controller
            control={control}
            name="isActive"
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" className="justify-between rounded-xl border p-3" data-invalid={fieldState.invalid}>
                <div>
                  <FieldLabel htmlFor="acct-active">Active</FieldLabel>
                  <FieldDescription>Inactive accounts can&apos;t receive new entries.</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </div>
                <Switch id="acct-active" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="secondary" onClick={onDone} disabled={formState.isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {account ? "Save" : "Create account"}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}
