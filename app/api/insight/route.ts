import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, prisma } from "@/lib/db";
import { itemByKey } from "@/lib/catalog";
import { ageYears, computeItemStatus } from "@/lib/status";
import { aiErrorCode, buildContext, ChatMessage, generateInsight, INITIAL_ASK, Provider } from "@/lib/ai";
import { EntryDTO, InsightMessageDTO, PersonDTO, RiskFactors } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function toDTO(m: { id: string; role: string; content: string; createdAt: Date }): InsightMessageDTO {
  return { id: m.id, role: m.role as "user" | "assistant", content: m.content, createdAt: m.createdAt.toISOString() };
}

async function thread(personId: string, itemKey: string) {
  return prisma.insightMessage.findMany({
    where: { personId, itemKey },
    orderBy: { createdAt: "asc" },
  });
}

// GET → load the saved thread for an item (no AI call, no key needed).
export async function GET(req: NextRequest) {
  await ensureSchema();
  const personId = req.nextUrl.searchParams.get("personId") || "";
  const itemKey = req.nextUrl.searchParams.get("itemKey") || "";
  if (!personId || !itemKey) return NextResponse.json({ messages: [] });
  const msgs = await thread(personId, itemKey);
  return NextResponse.json({ messages: msgs.map(toDTO) });
}

const schema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  personId: z.string(),
  itemKey: z.string().optional(),
  question: z.string().optional(), // a follow-up; absent = initial read
  regenerate: z.boolean().optional(), // clear thread and start fresh
  acknowledgedExternalAI: z.literal(true),
  lang: z.enum(["zh", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  await ensureSchema();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { provider, personId, itemKey, question, regenerate, lang } = parsed.data;

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) return NextResponse.json({ error: "person not found" }, { status: 404 });

  const entries = await prisma.entry.findMany({ where: { personId } });
  const personDTO: PersonDTO = {
    ...person,
    sex: person.sex as "male" | "female",
    birthDate: person.birthDate.toISOString(),
    riskFactors: person.riskFactors as RiskFactors | null,
  };
  const entryDTOs: EntryDTO[] = entries.map((e) => ({ ...e, status: e.status as EntryDTO["status"], performedAt: e.performedAt.toISOString() }));
  const item = itemKey ? itemByKey(itemKey) : undefined;
  if (itemKey && !item) return NextResponse.json({ error: "unknown health item" }, { status: 400 });
  const key = itemKey ?? "_general";

  if (regenerate) await prisma.insightMessage.deleteMany({ where: { personId, itemKey: key } });

  const status = item ? computeItemStatus(item, entryDTOs, personDTO) : undefined;
  const history = item
    ? entryDTOs.filter((e) => e.itemKey === item.key).sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt))
    : undefined;
  const context = buildContext({ item, status, person: personDTO, ageYears: ageYears(personDTO.birthDate), history });

  // Persist the follow-up question (if any) before generating.
  if (question?.trim()) {
    await prisma.insightMessage.create({ data: { personId, itemKey: key, role: "user", content: question.trim() } });
  }

  // Build the message array to send: synthetic opening ask + saved thread.
  const saved = await thread(personId, key);
  const messages: ChatMessage[] = [
    { role: "user", content: INITIAL_ASK[lang ?? "zh"] },
    ...saved.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  try {
    const text = await generateInsight({ provider: provider as Provider, lang: lang ?? "zh", context, messages });
    await prisma.insightMessage.create({ data: { personId, itemKey: key, role: "assistant", content: text } });
    const updated = await thread(personId, key);
    return NextResponse.json({ messages: updated.map(toDTO) });
  } catch (err) {
    // Roll back the just-saved user question so a retry isn't doubled.
    if (question?.trim()) {
      const last = await prisma.insightMessage.findFirst({ where: { personId, itemKey: key, role: "user" }, orderBy: { createdAt: "desc" } });
      if (last && last.content === question.trim()) await prisma.insightMessage.delete({ where: { id: last.id } });
    }
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message, code: aiErrorCode(err) }, { status: 502 });
  }
}
