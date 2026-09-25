"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { PasswordInput } from "@/components/forms/password-input";
import { PasswordStrength } from "@/components/forms/password-strength";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api-client";
import { resetPasswordSchema } from "@/validators/auth.schema";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  const { register, handleSubmit, setError, formState, control } = form;
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api("/api/auth/reset-password", { method: "POST", body: values });
      toast.success("Password updated ✓");
      router.replace("/login?reason=reset");
    } catch (error) {
      if (applyServerErrors(error, setError, ["password", "confirmPassword"])) return;
      setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormAlert message={formError} />
      <FieldGroup>
        <Field data-invalid={!!formState.errors.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!formState.errors.password} {...register("password")} />
          <PasswordStrength password={password ?? ""} />
          <FieldError errors={[formState.errors.password]} />
        </Field>
        <Field data-invalid={!!formState.errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!formState.errors.confirmPassword} {...register("confirmPassword")} />
          <FieldError errors={[formState.errors.confirmPassword]} />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Spinner />}
        Update password
      </Button>
    </form>
  );
}
