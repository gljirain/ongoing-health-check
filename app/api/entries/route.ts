import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { itemByKey } from "@/lib/catalog";

const schema = z.object({
  personId: z.string().min(1),
  itemKey: z.string().min(1),
  performedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  status: z.enum(["green", "yellow", "red"]).nullable().optional(),
  valueNum: z.number().nullable().optional(),
  valueText: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  if (!itemByKey(d.itemKey)) {
    return NextResponse.json({ error: "unknown health item" }, { status: 400 });
  }
  const person = await prisma.person.findUnique({ where: { id: d.personId }, select: { id: true } });
  if (!person) {
    return NextResponse.json({ error: "person not found" }, { status: 404 });
  }
  const entry = await prisma.entry.create({
    data: {
      personId: d.personId,
      itemKey: d.itemKey,
      performedAt: new Date(d.performedAt),
      status: d.status ?? undefined,
      valueNum: d.valueNum ?? undefined,
      valueText: d.valueText ?? undefined,
      notes: d.notes ?? undefined,
      source: d.source ?? undefined,
    },
  });
  return NextResponse.json({ ...entry, performedAt: entry.performedAt.toISOString() });
}
