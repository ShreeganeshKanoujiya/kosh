"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api-client";
import { forgotPasswordSchema } from "@/validators/auth.schema";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { companyCode: "", username: "" },
  });
  const { register, handleSubmit, formState, setValue } = form;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kosh-company-code");
      if (saved) setValue("companyCode", saved);
    } catch {
      // storage unavailable
    }
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { message } = await api("/api/auth/forgot-password", { method: "POST", body: values });
      setSent(message ?? "Check your email for a reset link.");
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  if (sent) {
    return (
      <div className="space-y-6">
        <FormAlert tone="success" title="Request received" message={sent} />
        <Button asChild variant="secondary" size="lg" className="w-full">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormAlert message={formError} />
      <FieldGroup>
        <Controller
          control={form.control}
          name="companyCode"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="companyCode">Company code</FieldLabel>
              <Input
                {...field}
                id="companyCode"
                onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={12}
                aria-invalid={fieldState.invalid}
                className="font-mono tracking-[0.2em] uppercase"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Field data-invalid={!!formState.errors.username}>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input id="username" autoComplete="username" autoCapitalize="none" aria-invalid={!!formState.errors.username} {...register("username")} />
          <FieldError errors={[formState.errors.username]} />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Spinner />}
        Send reset link
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
