import { NextRequest, NextResponse } from "next/server";
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
  name: z.string().min(1),
  sex: z.enum(["male", "female"]),
  birthDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  isSelf: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  riskFactors: riskFactorsSchema.nullable().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const person = await prisma.person.create({
    data: {
      name: d.name,
      sex: d.sex,
      birthDate: new Date(d.birthDate),
      isSelf: d.isSelf ?? false,
      notes: d.notes ?? undefined,
      riskFactors: d.riskFactors ?? undefined,
    },
  });
  return NextResponse.json({ ...person, birthDate: person.birthDate.toISOString() });
}
