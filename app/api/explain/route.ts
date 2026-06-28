import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { aiErrorCode, explainLab } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  panel: z.string().optional(),
  provider: z.enum(["anthropic", "openai"]).optional(),
  acknowledgedExternalAI: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { slug, label, panel, provider, acknowledgedExternalAI } = parsed.data;

  // Cache hit → return immediately (no key needed; works offline once authored).
  const cached = await prisma.labExplainer.findUnique({ where: { slug } });
  if (cached) {
    return NextResponse.json({ zh: cached.zh, en: cached.en, reviewed: cached.reviewed, cached: true });
  }

  // Cache miss → must generate (needs consent + a key).
  if (!acknowledgedExternalAI || !provider) {
    return NextResponse.json({ error: "needs_generate", code: "needs_generate" }, { status: 409 });
  }
  try {
    const out = await explainLab({ provider, label, panel });
    await prisma.labExplainer.upsert({
      where: { slug },
      update: { zh: out.zh, en: out.en },
      create: { slug, zh: out.zh, en: out.en },
    });
    return NextResponse.json({ ...out, reviewed: false, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Explain failed";
    return NextResponse.json({ error: message, code: aiErrorCode(err) }, { status: 502 });
  }
}
