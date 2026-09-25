import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-page-title">Choose a new password</h1>
        <p className="text-caption text-[0.9375rem]">You&apos;ll be signed out of all devices after the change.</p>
      </div>
      {value.length >= 20 ? (
        <ResetPasswordForm token={value} />
      ) : (
        <div className="space-y-6">
          <FormAlert message="This reset link is incomplete or invalid. Request a new one." />
          <Button asChild size="lg" className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
