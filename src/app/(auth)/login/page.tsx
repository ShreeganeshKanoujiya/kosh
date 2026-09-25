import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthContext } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/navigation";

export const metadata: Metadata = { title: "Log in" };

const NOTICES: Record<string, string> = {
  session: "Your session has ended. Please log in again.",
  reset: "Password updated. Log in with your new password.",
  logout: "You've been logged out.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  // Authoritative check (DB-backed), so a revoked-but-unexpired token can't cause a redirect loop.
  if (await getAuthContext()) redirect(next);

  const reason = typeof params.reason === "string" ? params.reason : undefined;

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-page-title">Welcome back</h1>
        <p className="text-caption text-[0.9375rem]">Log in with your company code, username and password.</p>
      </div>
      <LoginForm next={next} notice={reason ? NOTICES[reason] : undefined} />
    </div>
  );
}
