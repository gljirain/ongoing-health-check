import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorCode, parseReport } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  text: z.string().optional(),
  images: z.array(z.string()).max(12).optional(), // data URLs
  acknowledgedExternalAI: z.literal(true),
  today: z.string().optional(), // client's local date, for relative-date resolution
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[/api/parse] could not read request body:", err);
    return NextResponse.json({ error: "Could not read request.", code: "bad_request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const imgs = (body as { images?: unknown })?.images;
    console.error(
      "[/api/parse] validation failed:",
      JSON.stringify(parsed.error.flatten()),
      "| images:",
      Array.isArray(imgs) ? imgs.length : 0,
    );
    return NextResponse.json({ error: parsed.error.flatten(), code: "bad_request" }, { status: 400 });
  }

  const { provider, text, today } = parsed.data;
  // Defensive: drop blank/invalid image data URLs (e.g. a PDF page that rendered
  // empty) so one bad page can't make the whole request fail at the provider.
  const allImages = parsed.data.images ?? [];
  const images = allImages.filter((s) => s.startsWith("data:image/") && s.length > 1000);
  const dropped = allImages.length - images.length;
  const payloadMB = (images.reduce((n, s) => n + s.length, 0) / 1048576).toFixed(1);
  console.log(
    `[/api/parse] provider=${provider} images=${images.length}${dropped ? ` (dropped ${dropped} blank)` : ""} ~${payloadMB}MB text=${!!text?.trim()}`,
  );

  if (!text?.trim() && images.length === 0) {
    return NextResponse.json({ error: "Provide report text or at least one image.", code: "bad_request" }, { status: 400 });
  }

  try {
    const result = await parseReport({ provider, text, images, today });
    console.log(`[/api/parse] ok — ${result.findings.length} findings, ${result.labs.length} labs`);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    // Real cause to the terminal running the app, beyond the friendly UI message.
    console.error("[/api/parse] failed:", aiErrorCode(err), "—", message);
    return NextResponse.json({ error: message, code: aiErrorCode(err) }, { status: 502 });
  }
}
