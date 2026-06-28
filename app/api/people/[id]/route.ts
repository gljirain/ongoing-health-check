import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

const riskFactorsSchema = z.object({
  smoking: z.object({
    status: z.enum(["never", "former", "current"]).optional(),
    packYears: z.number().min(0).nullable().optional(),
    quitYearsAgo: z.number().min(0).nullable().optional(),
  }).optional(),
  familyHistory: z.object({
    colorectalCancer: z.boolean().optional(),
    breastCancer: z.boolean().optional(),
    gastricCancer: z.boolean().optional(),
    prostateCancer: z.boolean().optional(),
  }).optional(),
  conditions: z.object({
    ibd: z.boolean().optional(),
    hereditaryCancerSyndrome: z.boolean().optional(),
    sleepApnea: z.boolean().optional(),
    heartLungDisease: z.boolean().optional(),
    anesthesiaReaction: z.boolean().optional(),
  }).optional(),
  regionOrAncestry: z.string().nullable().optional(),
});

const schema = z.object({
  name: z.string().min(1).optional(),
  sex: z.enum(["male", "female"]).optional(),
  birthDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date").optional(),
  notes: z.string().nullable().optional(),
  riskFactors: riskFactorsSchema.nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const person = await prisma.person.update({
    where: { id },
    data: {
      ...(d.name != null ? { name: d.name } : {}),
      ...(d.sex != null ? { sex: d.sex } : {}),
      ...(d.birthDate != null ? { birthDate: new Date(d.birthDate) } : {}),
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
      ...(d.riskFactors !== undefined ? { riskFactors: d.riskFactors ?? Prisma.JsonNull } : {}),
    },
  });
  return NextResponse.json({ ...person, birthDate: person.birthDate.toISOString() });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await prisma.insightMessage.deleteMany({ where: { personId: id } });
  await prisma.person.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
