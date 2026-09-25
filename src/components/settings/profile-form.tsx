"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserAvatar } from "@/components/common/user-avatar";
import { applyServerErrors } from "@/components/forms/form-utils";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api-client";
import { updateProfileSchema } from "@/validators/auth.schema";

export function ProfileForm() {
  const me = useSession();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: me.user.fullName, email: me.user.email ?? "" },
  });
  const { register, handleSubmit, setError, reset, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api("/api/me", { method: "PATCH", body: values });
      toast.success("Profile updated ✓");
      reset(values);
      router.refresh();
    } catch (error) {
      if (!applyServerErrors(error, setError, ["fullName", "email"])) toast.error(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar name={me.user.fullName} seed={me.user.id} className="size-16 text-lg" />
        <div>
          <p className="font-medium">{me.user.fullName}</p>
          <p className="text-caption">
            {me.role.name} at {me.company.name}
          </p>
        </div>
      </div>

      <FieldGroup className="max-w-xl">
        <Field data-invalid={!!formState.errors.fullName}>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input id="fullName" autoComplete="name" aria-invalid={!!formState.errors.fullName} {...register("fullName")} />
          <FieldError errors={[formState.errors.fullName]} />
        </Field>
        <Field data-invalid={!!formState.errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!formState.errors.email} {...register("email")} />
          <FieldDescription>Used for password-reset links.</FieldDescription>
          <FieldError errors={[formState.errors.email]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input id="username" value={me.user.username} readOnly disabled className="font-mono" />
          <FieldDescription>Usernames can&apos;t be changed. Ask an admin to create a new account if needed.</FieldDescription>
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={formState.isSubmitting || !formState.isDirty}>
        {formState.isSubmitting && <Spinner />}
        Save changes
      </Button>
    </form>
  );
}
