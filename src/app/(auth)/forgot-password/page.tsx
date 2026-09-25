import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-page-title">Forgot your password?</h1>
        <p className="text-caption text-[0.9375rem]">
          If your account has an email address, we&apos;ll send you a reset link. Otherwise, ask your company admin to
          reset it for you.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
