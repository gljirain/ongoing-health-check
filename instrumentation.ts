// Runs once when the server boots. We use it to self-heal the local SQLite
// schema on desktop installs (see lib/db.ts ensureSchema).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSchema } = await import("./lib/db");
    await ensureSchema();
  }
}
