"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/common/responsive-dialog";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { PasswordInput } from "@/components/forms/password-input";
import { PasswordStrength } from "@/components/forms/password-strength";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useUserMutations } from "@/hooks/use-users";
import { errorMessage } from "@/lib/api-client";
import type { UserDTO } from "@/types/dto";
import { adminResetPasswordSchema } from "@/validators/user.schema";
import { generatePassword } from "./generate-password";

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Reset password for ${user.fullName}`}
      description="Share the new password with them securely. They'll be signed out everywhere."
    >
      <ResetPasswordForm user={user} onDone={() => onOpenChange(false)} />
    </ResponsiveDialog>
  );
}

function ResetPasswordForm({ user, onDone }: { user: UserDTO; onDone: () => void }) {
  const { resetPassword } = useUserMutations();
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [initialPassword] = useState(generatePassword);
  const form = useForm({ resolver: zodResolver(adminResetPasswordSchema), defaultValues: { newPassword: initialPassword } });
  const { register, handleSubmit, setValue, setError, control, formState } = form;
  const newPassword = useWatch({ control, name: "newPassword" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await resetPassword.mutateAsync({ id: user.id, input: values });
      toast.success("Password reset ✓", { description: `${user.fullName} has been signed out of all devices.` });
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, ["newPassword"])) setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="contents">
      <ResponsiveDialogBody className="space-y-5">
        <FormAlert message={formError} />
        <FieldGroup>
          <Field data-invalid={!!formState.errors.newPassword}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(newPassword ?? "");
                      setCopied(true);
                    } catch {
                      toast.error("Couldn't copy");
                    }
                  }}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => {
                    setValue("newPassword", generatePassword(), { shouldValidate: true });
                    setCopied(false);
                  }}
                >
                  Generate
                </button>
              </div>
            </div>
            <PasswordInput id="newPassword" autoComplete="new-password" aria-invalid={!!formState.errors.newPassword} {...register("newPassword")} />
            <PasswordStrength password={newPassword ?? ""} username={user.username} />
            <FieldError errors={[formState.errors.newPassword]} />
          </Field>
        </FieldGroup>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="secondary" onClick={onDone} disabled={formState.isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          Reset password
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}
