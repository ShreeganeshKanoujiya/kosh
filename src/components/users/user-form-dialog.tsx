"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/common/responsive-dialog";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { PasswordInput } from "@/components/forms/password-input";
import { PasswordStrength } from "@/components/forms/password-strength";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useAssignableRoles, useUserMutations } from "@/hooks/use-users";
import { errorMessage } from "@/lib/api-client";
import type { UserDTO } from "@/types/dto";
import { createUserSchema, updateUserSchema } from "@/validators/user.schema";
import { generatePassword } from "./generate-password";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode. */
  user?: UserDTO | null;
  currentUserId: string;
};

export function UserFormDialog({ open, onOpenChange, user, currentUserId }: Props) {
  const close = () => onOpenChange(false);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={user ? `Edit ${user.fullName}` : "Add user"}
      description={user ? `@${user.username}` : "They'll log in with your company code, their username and this password."}
    >
      {user ? <EditUserForm user={user} currentUserId={currentUserId} onDone={close} /> : <CreateUserForm onDone={close} />}
    </ResponsiveDialog>
  );
}

function RoleSelect({
  value,
  onChange,
  invalid,
  disabled,
  currentRole,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  currentRole?: UserDTO["role"];
}) {
  const { data: roles, isLoading } = useAssignableRoles();
  const options = (roles ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description }));
  // Keep a non-assignable current role visible (e.g. editing someone whose role you can't grant).
  if (currentRole && !options.some((r) => r.id === currentRole.id)) {
    options.unshift({ id: currentRole.id, name: currentRole.name, description: null });
  }
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger id="roleId" className="w-full" aria-invalid={invalid}>
        <SelectValue placeholder={isLoading ? "Loading roles…" : "Select a role"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            <span className="font-medium">{r.name}</span>
            {r.description && <span className="text-muted-foreground"> — {r.description}</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const CREATE_FIELDS = ["fullName", "username", "email", "password", "roleId", "status"] as const;

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const { create } = useUserMutations();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", username: "", email: "", password: "", roleId: "", status: "active" as const },
  });
  const { register, handleSubmit, control, setError, setValue, formState } = form;
  const [password, username] = useWatch({ control, name: ["password", "username"] });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await create.mutateAsync(values);
      toast.success("User created ✓", { description: `${values.fullName} can now log in as “${values.username.toLowerCase()}”.` });
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, CREATE_FIELDS)) setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="contents">
      <ResponsiveDialogBody className="space-y-5">
        <FormAlert message={formError} />
        <FieldGroup>
          <Field data-invalid={!!errors.fullName}>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input id="fullName" autoComplete="off" aria-invalid={!!errors.fullName} {...register("fullName")} />
            <FieldError errors={[errors.fullName]} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={!!errors.username}>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input id="username" autoComplete="off" autoCapitalize="none" spellCheck={false} aria-invalid={!!errors.username} {...register("username")} />
              <FieldError errors={[errors.username]} />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input id="email" type="email" inputMode="email" autoComplete="off" aria-invalid={!!errors.email} {...register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
          </div>
          <Controller
            control={control}
            name="roleId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="roleId">Role</FieldLabel>
                <RoleSelect value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Temporary password</FieldLabel>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setValue("password", generatePassword(), { shouldValidate: true })}
              >
                Generate
              </button>
            </div>
            <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
            <PasswordStrength password={password ?? ""} username={username} />
            <FieldError errors={[errors.password]} />
          </Field>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Field orientation="horizontal" className="justify-between rounded-xl border p-3">
                <div>
                  <FieldLabel htmlFor="status">Active</FieldLabel>
                  <FieldDescription>Inactive users can&apos;t log in.</FieldDescription>
                </div>
                <Switch id="status" checked={field.value === "active"} onCheckedChange={(v) => field.onChange(v ? "active" : "disabled")} />
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
          Create user
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}

const EDIT_FIELDS = ["fullName", "email", "roleId", "status"] as const;

function EditUserForm({ user, currentUserId, onDone }: { user: UserDTO; currentUserId: string; onDone: () => void }) {
  const { update } = useUserMutations();
  const [formError, setFormError] = useState<string | null>(null);
  const isSelf = user.id === currentUserId;
  const lockedRole = isSelf || user.isOwner;

  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { fullName: user.fullName, email: user.email ?? "", roleId: user.role.id },
  });
  const { register, handleSubmit, control, setError, formState } = form;
  const errors = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const input = { ...values, roleId: lockedRole || values.roleId === user.role.id ? undefined : values.roleId };
    try {
      await update.mutateAsync({ id: user.id, input });
      toast.success("User updated ✓");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, EDIT_FIELDS)) setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="contents">
      <ResponsiveDialogBody className="space-y-5">
        <FormAlert message={formError} />
        <FieldGroup>
          <Field data-invalid={!!errors.fullName}>
            <FieldLabel htmlFor="edit-fullName">Full name</FieldLabel>
            <Input id="edit-fullName" aria-invalid={!!errors.fullName} {...register("fullName")} />
            <FieldError errors={[errors.fullName]} />
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="edit-email">Email</FieldLabel>
            <Input id="edit-email" type="email" inputMode="email" aria-invalid={!!errors.email} {...register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
          <Controller
            control={control}
            name="roleId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="roleId">Role</FieldLabel>
                <RoleSelect
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  disabled={lockedRole}
                  currentRole={user.role}
                />
                {lockedRole && (
                  <FieldDescription>
                    {user.isOwner ? "The owner's role can't be changed." : "You can't change your own role."}
                  </FieldDescription>
                )}
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="secondary" onClick={onDone} disabled={formState.isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={formState.isSubmitting || !formState.isDirty}>
          {formState.isSubmitting && <Spinner />}
          Save changes
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}
