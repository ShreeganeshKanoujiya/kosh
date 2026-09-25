import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create your company" };

export default function RegisterPage() {
  // The form owns its heading so it can swap to the company-code screen on success.
  return <RegisterForm />;
}
