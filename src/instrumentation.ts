/** Runs once when a server instance starts: fail fast on bad configuration. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("@/config/env");
    env();
  }
}
