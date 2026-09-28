import "server-only";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DIRECT_URL: z.string().optional(),
    DATABASE_SSL_CA: z.string().optional(),
    APP_URL: z.url().default("http://localhost:3000"),
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters (use `openssl rand -base64 48`)"),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    SESSION_MAX_AGE_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    // Optional SMTP server for password-reset emails (sent with Nodemailer).
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    /** TLS from the first byte. Defaults to true on port 465; otherwise STARTTLS is used. */
    SMTP_SECURE: z.stringbool().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    // Receipts and UPI screenshots. Supabase Storage when configured; otherwise files go to
    // UPLOAD_DIR on local disk (defaults to .data/uploads in development, off in production).
    SUPABASE_URL: z.union([z.literal(""), z.url()]).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().min(1).default("attachments"),
    UPLOAD_DIR: z.string().optional(),
  })
  .refine((e) => !e.SMTP_USER === !e.SMTP_PASS, { path: ["SMTP_PASS"], message: "Set both SMTP_USER and SMTP_PASS, or neither" })
  .refine((e) => !e.SMTP_HOST || e.MAIL_FROM, { path: ["MAIL_FROM"], message: "MAIL_FROM is required when SMTP_HOST is set" })
  .refine((e) => !e.SUPABASE_URL === !e.SUPABASE_SERVICE_ROLE_KEY, {
    path: ["SUPABASE_SERVICE_ROLE_KEY"],
    message: "Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or neither",
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Validated server environment. Parsed lazily so `next build` does not require
 * runtime secrets, but the first request fails loudly if configuration is wrong.
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const isProduction = () => env().NODE_ENV === "production";
