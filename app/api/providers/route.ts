import { NextResponse } from "next/server";
import { availableProviders } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ providers: await availableProviders() });
}
