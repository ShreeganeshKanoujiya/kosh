import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate, studio, seed) must use a direct / session-mode connection.
// On Supabase that is the "Session pooler" (port 5432) or the direct connection string —
// never the transaction pooler (port 6543), which cannot run migrations.
// The running app connects separately via DATABASE_URL (see src/lib/db/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
