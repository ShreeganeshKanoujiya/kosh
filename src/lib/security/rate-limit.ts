import "server-only";
import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window counter stored in Postgres so limits hold across serverless
 * instances. One atomic upsert per call; expired windows reset in place.
 */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + rule.windowSeconds * 1000);
  const rows = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT (key) DO UPDATE SET
      count    = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
    RETURNING count, reset_at`;

  const row = rows[0];
  const count = Number(row?.count ?? 1);
  const retryAfterSeconds = Math.max(1, Math.ceil(((row?.reset_at ?? resetAt).getTime() - Date.now()) / 1000));

  // Opportunistic cleanup of long-expired windows (~1% of calls).
  if (Math.random() < 0.01) {
    void prisma.rateLimit
      .deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
      .catch(() => undefined);
  }

  return { allowed: count <= rule.limit, remaining: Math.max(0, rule.limit - count), retryAfterSeconds };
}

/** Consume and throw a 429 AppError when the limit is exceeded. */
export async function enforceRateLimit(key: string, rule: RateLimitRule, message?: string) {
  const result = await consumeRateLimit(key, rule);
  if (!result.allowed) throw Errors.rateLimited(result.retryAfterSeconds, message);
  return result;
}
