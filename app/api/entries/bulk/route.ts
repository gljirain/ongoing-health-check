import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { itemByKey } from "@/lib/catalog";

const entrySchema = z.object({
  itemKey: z.string().min(1), // catalog key, OR "lab.<slug>" for generic labs
  performedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  status: z.enum(["green", "yellow", "red"]).nullable().optional(),
  valueText: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  // Layer-0 generic-lab fields
  label: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  refText: z.string().nullable().optional(),
  panel: z.string().nullable().optional(),
});

const schema = z.object({
  personId: z.string().min(1),
  entries: z.array(entrySchema).min(1).max(300),
});

const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { personId, entries } = parsed.data;

  const person = await prisma.person.findUnique({ where: { id: personId }, select: { id: true } });
  if (!person) return NextResponse.json({ error: "person not found" }, { status: 404 });

  // Valid = a known catalog item OR a Layer-0 generic row (lab./condition./procedure.).
  const GENERIC = ["lab.", "condition.", "procedure."];
  const valid = entries.filter((e) => GENERIC.some((p) => e.itemKey.startsWith(p)) || itemByKey(e.itemKey));

  // Dedup vs what's already logged: same item + same day + same value = skip.
  // Makes re-uploading the same report safe (idempotent).
  const existing = await prisma.entry.findMany({
    where: { personId, itemKey: { in: valid.map((e) => e.itemKey) } },
    select: { itemKey: true, performedAt: true, valueText: true },
  });
  const seen = new Set(existing.map((e) => `${e.itemKey}|${dayKey(e.performedAt)}|${e.valueText ?? ""}`));

  const toCreate = valid.filter((e) => {
    const k = `${e.itemKey}|${dayKey(e.performedAt)}|${e.valueText ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k); // also dedup within this same batch
    return true;
  });

  if (toCreate.length > 0) {
    await prisma.entry.createMany({
      data: toCreate.map((e) => ({
        personId,
        itemKey: e.itemKey,
        performedAt: new Date(e.performedAt),
        status: e.status ?? undefined,
        valueText: e.valueText ?? undefined,
        notes: e.notes ?? undefined,
        source: e.source ?? "imported",
        label: e.label ?? undefined,
        unit: e.unit ?? undefined,
        refText: e.refText ?? undefined,
        panel: e.panel ?? undefined,
      })),
    });
  }

  return NextResponse.json({ imported: toCreate.length, skipped: valid.length - toCreate.length });
}
