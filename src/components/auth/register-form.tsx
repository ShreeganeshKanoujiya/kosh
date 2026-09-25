"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { PasswordInput } from "@/components/forms/password-input";
import { PasswordStrength } from "@/components/forms/password-strength";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api-client";
import type { RegisterResultDTO } from "@/types/dto";
import { registerSchema } from "@/validators/auth.schema";
import { CompanyCodeReveal } from "./company-code-reveal";

const FIELDS = ["companyName", "ownerFullName", "ownerEmail", "username", "password", "confirmPassword"] as const;

export function RegisterForm() {
  const [result, setResult] = useState<RegisterResultDTO | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      companyName: "",
      ownerFullName: "",
      ownerEmail: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { register, handleSubmit, setError, formState, control } = form;
  const [password, username] = useWatch({ control, name: ["password", "username"] });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { data } = await api<RegisterResultDTO>("/api/auth/register", { method: "POST", body: values });
      setResult(data);
      toast.success("Company created ✓");
    } catch (error) {
      if (applyServerErrors(error, setError, FIELDS)) return;
      setFormError(errorMessage(error));
    }
  });

  if (result) return <CompanyCodeReveal result={result} />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-page-title">Create your company</h1>
        <p className="text-caption text-[0.9375rem]">
          Set up Kosh for your team in under a minute. You&apos;ll get a company code to share with your staff.
        </p>
      </div>
      <FormAlert message={formError} />

      <FieldSet>
        <FieldLegend>Company</FieldLegend>
        <FieldGroup>
          <Field data-invalid={!!errors.companyName}>
            <FieldLabel htmlFor="companyName">Company name</FieldLabel>
            <Input id="companyName" autoComplete="organization" placeholder="Acme Traders Pvt Ltd" aria-invalid={!!errors.companyName} {...register("companyName")} />
            <FieldError errors={[errors.companyName]} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Owner account</FieldLegend>
        <FieldDescription>You&apos;ll have full access and can add your team afterwards.</FieldDescription>
        <FieldGroup>
          <Field data-invalid={!!errors.ownerFullName}>
            <FieldLabel htmlFor="ownerFullName">Full name</FieldLabel>
            <Input id="ownerFullName" autoComplete="name" placeholder="Priya Sharma" aria-invalid={!!errors.ownerFullName} {...register("ownerFullName")} />
            <FieldError errors={[errors.ownerFullName]} />
          </Field>

          <Field data-invalid={!!errors.ownerEmail}>
            <FieldLabel htmlFor="ownerEmail">Email</FieldLabel>
            <Input id="ownerEmail" type="email" inputMode="email" autoComplete="email" placeholder="priya@acme.in" aria-invalid={!!errors.ownerEmail} {...register("ownerEmail")} />
            <FieldDescription>Used for password resets. You log in with your username.</FieldDescription>
            <FieldError errors={[errors.ownerEmail]} />
          </Field>

          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="priya"
              aria-invalid={!!errors.username}
              {...register("username")}
            />
            <FieldError errors={[errors.username]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
            <PasswordStrength password={password ?? ""} username={username} />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Spinner />}
        {formState.isSubmitting ? "Creating company…" : "Create company"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have a company code?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
