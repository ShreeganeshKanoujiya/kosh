// Local PostgreSQL for development, from the `embedded-postgres` package: no install or Docker needed.
//
//   npm run dev        starts it automatically (see scripts/dev.mjs)
//   npm run db:local   runs it on its own until Ctrl+C, e.g. for Prisma Studio or migrations
//
// It's used when DATABASE_URL points at localhost and nothing is listening on that port. The port,
// user, password and database name come from DATABASE_URL. Data is kept in .data/postgres (git-ignored);
// a brand-new database gets the migrations and permission seed applied on first start.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import EmbeddedPostgres from "embedded-postgres";

const ROOT = path.join(import.meta.dirname, "..");
export const DATA_DIR = path.join(ROOT, ".data", "postgres");
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Connection details if DATABASE_URL points at this machine; null for a remote database such as Supabase. */
export function localDatabase(databaseUrl = process.env.DATABASE_URL) {
  let url;
  try {
    url = new URL(databaseUrl ?? "");
  } catch {
    return null;
  }
  if (!LOCAL_HOSTS.has(url.hostname)) return null;
  return {
    host: url.hostname.replace(/^\[|\]$/g, ""),
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username || "postgres"),
    password: decodeURIComponent(url.password || "postgres"),
    database: url.pathname.slice(1) || "postgres",
  };
}

export function isListening({ host, port }) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(1000, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

/** Start the server (creating the cluster and database if needed). Returns a stop function. */
export async function startLocalDatabase(db) {
  const fresh = !existsSync(DATA_DIR);
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: db.user,
    password: db.password,
    port: db.port,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {},
  });

  console.log(`- Starting local PostgreSQL on port ${db.port} (data in .data/postgres)`);
  if (fresh) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase(db.database);
  } catch {
    // already exists
  }

  if (fresh) {
    console.log("- New database: applying migrations and seeding permissions");
    // Point the Prisma CLI at this database even if .env's DIRECT_URL names another one.
    const env = { ...process.env, DIRECT_URL: process.env.DATABASE_URL };
    const result = spawnSync("npm run db:deploy", { cwd: ROOT, env, stdio: "inherit", shell: true });
    if (result.status !== 0) throw new Error("npm run db:deploy failed");
  }

  let stopped = false;
  return async () => {
    if (stopped) return;
    stopped = true;
    try {
      await pg.stop();
    } catch {
      // already shut down (e.g. by the console's Ctrl+C)
    }
  };
}

// `npm run db:local`: run the database on its own until Ctrl+C.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  dotenv.config({ path: path.join(ROOT, ".env"), quiet: true });
  const db = localDatabase();
  if (!db) {
    console.error("DATABASE_URL in .env doesn't point at localhost, so there's no local database to start.");
    process.exit(1);
  }
  if (await isListening(db)) {
    console.log(`PostgreSQL is already running on port ${db.port}.`);
    process.exit(0);
  }
  const stop = await startLocalDatabase(db);
  console.log(`- Ready: postgresql://${db.user}:****@${db.host}:${db.port}/${db.database} (Ctrl+C to stop)`);
  const shutdown = async () => {
    await stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  setInterval(() => {}, 1 << 30);
}
