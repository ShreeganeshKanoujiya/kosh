import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";

/**
 * TLS: when DATABASE_SSL_CA holds a PEM certificate (e.g. Supabase's CA), connect
 * with full certificate verification. sslmode params are stripped from the URL
 * because node-postgres lets them override the explicit `ssl` option.
 */
function connectionConfig() {
  const url = process.env.DATABASE_URL;
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n").trim();
  if (!url || !ca) return { connectionString: url };
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  parsed.searchParams.delete("sslrootcert");
  return { connectionString: parsed.toString(), ssl: { ca, rejectUnauthorized: true } };
}

function createClient() {
  // Read process.env directly (not via env()) so importing this module never throws
  // during `next build`; the pool only connects on the first query.
  const adapter = new PrismaPg({
    ...connectionConfig(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Reuse one client (and one pool) per process, including across dev hot reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Either the root client or an interactive-transaction client. Repositories accept both. */
export type DbClient = PrismaClient | Prisma.TransactionClient;
