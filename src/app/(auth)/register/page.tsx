import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create your company",
  description: "Set up Kosh for your business in about a minute: record, approve and report petty cash from any phone.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  // The form owns its heading so it can swap to the company-code screen on success.
  return <RegisterForm />;
}
