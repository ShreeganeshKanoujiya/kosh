"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/forms/form-utils";
import { PasswordInput } from "@/components/forms/password-input";
import { PasswordStrength } from "@/components/forms/password-strength";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api-client";
import { changePasswordSchema } from "@/validators/auth.schema";

export function ChangePasswordForm() {
  const me = useSession();
  const qc = useQueryClient();
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { register, handleSubmit, setError, reset, control, formState } = form;
  const newPassword = useWatch({ control, name: "newPassword" });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { message } = await api("/api/auth/change-password", { method: "POST", body: values });
      toast.success("Password changed ✓", { description: message });
      reset();
      qc.invalidateQueries({ queryKey: ["auth", "sessions"] });
    } catch (error) {
      if (!applyServerErrors(error, setError, ["currentPassword", "newPassword", "confirmPassword"])) {
        toast.error(errorMessage(error));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup className="max-w-xl">
        <Field data-invalid={!!errors.currentPassword}>
          <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
          <PasswordInput id="currentPassword" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...register("currentPassword")} />
          <FieldError errors={[errors.currentPassword]} />
        </Field>
        <Field data-invalid={!!errors.newPassword}>
          <FieldLabel htmlFor="newPassword">New password</FieldLabel>
          <PasswordInput id="newPassword" autoComplete="new-password" aria-invalid={!!errors.newPassword} {...register("newPassword")} />
          <PasswordStrength password={newPassword ?? ""} username={me.user.username} />
          <FieldError errors={[errors.newPassword]} />
        </Field>
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Spinner />}
        Change password
      </Button>
    </form>
  );
}
