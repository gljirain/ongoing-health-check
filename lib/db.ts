import { PrismaClient } from "@prisma/client";

// Single Prisma instance across hot-reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ── Self-healing schema (local SQLite / desktop only) ───────────────────────
// A packaged desktop install keeps its DB in the user's app-data dir. When the
// app updates with new columns/tables, that existing DB would be stale. This
// runs once on server boot and idempotently patches it — no prisma CLI needed.
// (Postgres/cloud is managed by real migrations, so this is skipped there.)
let schemaEnsured: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!schemaEnsured) {
    schemaEnsured = (async () => {
      if (!(process.env.DATABASE_URL ?? "").startsWith("file:")) return; // SQLite only
      try {
        const addMissing = async (table: string, cols: [string, string][]) => {
          const info = await prisma.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info('${table}')`);
          const have = new Set(info.map((c) => c.name));
          for (const [col, type] of cols) {
            if (!have.has(col)) await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${col}" ${type}`);
          }
        };
        await addMissing("Entry", [
          ["label", "TEXT"],
          ["unit", "TEXT"],
          ["refText", "TEXT"],
          ["panel", "TEXT"],
        ]);
        await addMissing("Person", [["riskFactors", "TEXT"]]);
        await prisma.$executeRawUnsafe(
          `CREATE TABLE IF NOT EXISTS "Setting" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
        );
        await prisma.$executeRawUnsafe(
          `CREATE TABLE IF NOT EXISTS "LabExplainer" ("slug" TEXT NOT NULL PRIMARY KEY, "zh" TEXT NOT NULL, "en" TEXT NOT NULL, "reviewed" BOOLEAN NOT NULL DEFAULT false, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
        );
        await prisma.$executeRawUnsafe(
          `CREATE TABLE IF NOT EXISTS "InsightMessage" ("id" TEXT NOT NULL PRIMARY KEY, "personId" TEXT NOT NULL, "itemKey" TEXT NOT NULL, "role" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "InsightMessage_personId_itemKey_idx" ON "InsightMessage" ("personId", "itemKey")`,
        );
      } catch (e) {
        console.error("ensureSchema failed:", e);
      }
    })();
  }
  return schemaEnsured;
}
