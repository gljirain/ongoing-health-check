import { NextResponse } from "next/server";
import { ensureSchema, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// One call to hydrate the dashboard: all people + all entries.
export async function GET() {
  await ensureSchema(); // self-heal a stale local DB before first read
  const [people, entries] = await Promise.all([
    prisma.person.findMany({ orderBy: [{ isSelf: "desc" }, { createdAt: "asc" }] }),
    prisma.entry.findMany({ orderBy: { performedAt: "desc" } }),
  ]);
  return NextResponse.json({
    people: people.map((p) => ({ ...p, birthDate: p.birthDate.toISOString() })),
    entries: entries.map((e) => ({ ...e, performedAt: e.performedAt.toISOString() })),
  });
}
