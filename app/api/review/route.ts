import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, prisma } from "@/lib/db";
import { HEALTH_ITEMS, itemByKey } from "@/lib/catalog";
import { ageYears, computeAllStatuses } from "@/lib/status";
import { aiErrorCode, generateReview, Provider } from "@/lib/ai";
import { EntryDTO, PersonDTO, RiskFactors } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REVIEW_KEY = "_review"; // persisted as an InsightMessage row per person

// GET → the last saved review (no AI call, no key needed).
export async function GET(req: NextRequest) {
  await ensureSchema();
  const personId = req.nextUrl.searchParams.get("personId") || "";
  if (!personId) return NextResponse.json({ review: null });
  const row = await prisma.insightMessage.findFirst({
    where: { personId, itemKey: REVIEW_KEY },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return NextResponse.json({ review: null });
  try {
    const review = JSON.parse(row.content);
    return NextResponse.json({ review: { ...review, generatedAt: row.createdAt.toISOString() } });
  } catch {
    return NextResponse.json({ review: null });
  }
}

const schema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  personId: z.string(),
  acknowledgedExternalAI: z.literal(true),
  lang: z.enum(["zh", "en"]).optional(),
});

function buildReviewContext(person: PersonDTO, entries: EntryDTO[], lang: "zh" | "en"): string {
  const age = ageYears(person.birthDate);
  const lines: string[] = [];
  lines.push(`PROFILE: ${person.sex}, ${age} years old.`);
  if (person.riskFactors) lines.push(`RISK FACTORS: ${JSON.stringify(person.riskFactors)}`);
  lines.push("");
  lines.push(`KNOWN CATALOG KEYS (use these for any log_entry itemKey): ${HEALTH_ITEMS.map((i) => i.key).join(", ")}`);
  lines.push("");

  const fmt = (e: EntryDTO, name: string) =>
    `- ${name} | ${new Date(e.performedAt).toISOString().slice(0, 10)} | ${e.status ?? "—"} | ${e.valueText ?? ""}${e.notes ? ` (${e.notes})` : ""}`;
  const findings = entries.filter((e) => !/^(lab|condition|procedure)\./.test(e.itemKey));
  const labs = entries.filter((e) => e.itemKey.startsWith("lab."));
  const conditions = entries.filter((e) => e.itemKey.startsWith("condition."));
  const procedures = entries.filter((e) => e.itemKey.startsWith("procedure."));

  lines.push("LOGGED ENTRIES:");
  if (findings.length) lines.push("[tracked findings]", ...findings.map((e) => fmt(e, itemByKey(e.itemKey)?.name ?? e.itemKey)));
  if (labs.length) lines.push("[labs]", ...labs.map((e) => fmt(e, e.label ?? e.itemKey)));
  if (conditions.length) lines.push("[conditions]", ...conditions.map((e) => fmt(e, e.label ?? e.itemKey)));
  if (procedures.length) lines.push("[procedures]", ...procedures.map((e) => fmt(e, e.label ?? e.itemKey)));
  lines.push("");

  lines.push("CURRENT DETERMINISTIC ASSESSMENT (the app's lights — don't restate, augment/connect):");
  for (const s of computeAllStatuses(person, entries)) {
    if (s.eligibility !== "eligible" && s.light === "gray") continue;
    const due = s.dueInMonths != null ? `, dueInMonths=${Math.round(s.dueInMonths)}` : "";
    lines.push(`- ${s.item.name} (${s.item.nameZh}): light=${s.light}${due} — ${s.reason[lang]}`);
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  await ensureSchema();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten(), code: "bad_request" }, { status: 400 });
  const { provider, personId, lang } = parsed.data;

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) return NextResponse.json({ error: "person not found" }, { status: 404 });
  const entries = await prisma.entry.findMany({ where: { personId } });

  const personDTO: PersonDTO = {
    ...person,
    sex: person.sex as "male" | "female",
    birthDate: person.birthDate.toISOString(),
    riskFactors: person.riskFactors as RiskFactors | null,
  };
  const entryDTOs: EntryDTO[] = entries.map((e) => ({
    ...e,
    status: e.status as EntryDTO["status"],
    performedAt: e.performedAt.toISOString(),
  }));

  const context = buildReviewContext(personDTO, entryDTOs, lang ?? "zh");

  try {
    const review = await generateReview({ provider: provider as Provider, lang: lang ?? "zh", context });
    await prisma.insightMessage.deleteMany({ where: { personId, itemKey: REVIEW_KEY } });
    const row = await prisma.insightMessage.create({
      data: { personId, itemKey: REVIEW_KEY, role: "assistant", content: JSON.stringify(review) },
    });
    return NextResponse.json({ review: { ...review, generatedAt: row.createdAt.toISOString() } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed";
    console.error("[/api/review] failed:", aiErrorCode(err), "—", message);
    return NextResponse.json({ error: message, code: aiErrorCode(err) }, { status: 502 });
  }
}
