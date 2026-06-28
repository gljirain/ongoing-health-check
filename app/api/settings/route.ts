import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { KEYS, setSetting, settingsStatus } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Returns only non-secret status (configured?/fromUser?), never the key values.
export async function GET() {
  return NextResponse.json(await settingsStatus());
}

const schema = z.object({
  anthropicKey: z.string().nullable().optional(),
  openaiKey: z.string().nullable().optional(),
  defaultProvider: z.enum(["anthropic", "openai"]).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  // Only write fields explicitly present. Trim keys; empty string clears.
  if (d.anthropicKey !== undefined) await setSetting(KEYS.anthropicKey, d.anthropicKey?.trim() ?? null);
  if (d.openaiKey !== undefined) await setSetting(KEYS.openaiKey, d.openaiKey?.trim() ?? null);
  if (d.defaultProvider !== undefined) await setSetting(KEYS.defaultProvider, d.defaultProvider ?? null);
  return NextResponse.json(await settingsStatus());
}
