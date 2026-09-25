"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiClientError, api, errorMessage } from "@/lib/api-client";
import { loginSchema } from "@/validators/auth.schema";

const REMEMBER_KEY = "kosh-company-code";

function readRemembered() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { companyCode: "", username: "", password: "" },
  });
  const { register, handleSubmit, setError, setValue, setFocus, formState } = form;

  useEffect(() => {
    const saved = readRemembered();
    if (saved) {
      setValue("companyCode", saved);
      setFocus("username");
    } else {
      setFocus("companyCode");
    }
  }, [setValue, setFocus]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api("/api/auth/login", { method: "POST", body: values });
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, values.companyCode.trim().toUpperCase());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // storage unavailable — fine
      }
      router.replace(next);
      router.refresh();
    } catch (error) {
      if (applyServerErrors(error, setError, ["companyCode", "username", "password"])) return;
      const message = errorMessage(error);
      setFormError(message);
      if (error instanceof ApiClientError && error.code === "INVALID_CREDENTIALS") {
        form.resetField("password");
        setFocus("password");
      } else if (!(error instanceof ApiClientError)) {
        toast.error(message);
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormAlert message={notice} tone="info" />
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
                placeholder="ABC7X2"
                autoComplete="organization"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                maxLength={12}
                aria-invalid={fieldState.invalid}
                className="font-mono text-base tracking-[0.2em] uppercase placeholder:tracking-[0.2em]"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Field data-invalid={!!formState.errors.username}>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            placeholder="rahul01"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={!!formState.errors.username}
            {...register("username")}
          />
          <FieldError errors={[formState.errors.username]} />
        </Field>

        <Field data-invalid={!!formState.errors.password}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!formState.errors.password}
            {...register("password")}
          />
          <FieldError errors={[formState.errors.password]} />
        </Field>

        <Field orientation="horizontal">
          <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
          <FieldLabel htmlFor="remember" className="font-normal text-muted-foreground">
            Remember company code on this device
          </FieldLabel>
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Spinner />}
        {formState.isSubmitting ? "Signing in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to Kosh?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create a company
        </Link>
      </p>
    </form>
  );
}
