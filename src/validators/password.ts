import { z } from "zod";

// Shared by server validation and the client-side strength meter.

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "iloveyou",
  "admin123",
  "welcome1",
  "welcome123",
  "letmein123",
  "abc123456",
  "india@123",
  "pettycash",
  "petty@123",
]);

export interface PasswordCheck {
  id: "length" | "variety" | "common" | "username";
  label: string;
  passed: boolean;
}

export function checkPassword(password: string, context?: { username?: string }): PasswordCheck[] {
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  const lower = password.toLowerCase();
  const username = context?.username?.trim().toLowerCase();
  return [
    { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, passed: password.length >= PASSWORD_MIN_LENGTH },
    { id: "variety", label: "Mix of 3: lowercase, uppercase, number, symbol", passed: classes >= 3 },
    { id: "common", label: "Not a commonly used password", passed: password.length > 0 && !COMMON_PASSWORDS.has(lower) },
    {
      id: "username",
      label: "Does not contain your username",
      passed: !username || username.length < 3 || !lower.includes(username),
    },
  ];
}

/** 0–4 score for the strength meter. */
export function passwordScore(password: string, context?: { username?: string }): number {
  if (!password) return 0;
  const checks = checkPassword(password, context);
  const passed = checks.filter((c) => c.passed).length;
  const bonus = password.length >= 14 ? 1 : 0;
  return Math.min(4, Math.max(0, passed - 1 + bonus));
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .superRefine((value, ctx) => {
    for (const check of checkPassword(value)) {
      if (!check.passed && check.id !== "length" && check.id !== "username") {
        ctx.addIssue({ code: "custom", message: check.label });
      }
    }
  });

/** Adds the "must not contain username" rule to an object schema with `username` + `password` fields. */
export function refinePasswordNotUsername<T extends { username: string; password: string }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  const username = data.username.trim().toLowerCase();
  if (username.length >= 3 && data.password.toLowerCase().includes(username)) {
    ctx.addIssue({ code: "custom", path: ["password"], message: "Password must not contain the username" });
  }
}
