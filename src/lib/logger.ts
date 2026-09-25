type Level = "debug" | "info" | "warn" | "error";

function serialize(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    out[key] =
      value instanceof Error ? { name: value.name, message: value.message, stack: value.stack } : value;
  }
  return out;
}

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = { level, message, time: new Date().toISOString(), ...serialize(meta) };
  if (process.env.NODE_ENV === "production") {
    // Structured single-line JSON for log drains.
    console[level === "debug" ? "log" : level](JSON.stringify(entry));
  } else {
    console[level === "debug" ? "log" : level](`[${level}] ${message}`, meta ? serialize(meta) : "");
  }
}

/** Minimal structured logger. Never pass secrets, tokens or password material. */
export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
