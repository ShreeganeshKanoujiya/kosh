// `npm run dev`: start the local PostgreSQL when .env points at one that isn't running, then `next dev`.
// With a remote DATABASE_URL (Supabase) or a database that's already up, this just runs `next dev`.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import dotenv from "dotenv";
import { isListening, localDatabase, startLocalDatabase } from "./local-db.mjs";

const ROOT = path.join(import.meta.dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env"), quiet: true });

const db = localDatabase();
const stopDatabase = db && !(await isListening(db)) ? await startLocalDatabase(db) : null;

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const next = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], { cwd: ROOT, stdio: "inherit" });

// Ctrl+C reaches Next.js directly; wait for it to exit, then stop the database we started.
process.on("SIGINT", () => {});
process.on("SIGTERM", () => next.kill("SIGTERM"));
next.on("exit", async (code, signal) => {
  await stopDatabase?.();
  process.exit(code ?? (signal ? 1 : 0));
});
