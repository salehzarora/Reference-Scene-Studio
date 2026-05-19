import { NextResponse } from "next/server";
import { hasOpenAIKey, env } from "@/lib/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    providerConfigured: hasOpenAIKey(),
    provider: hasOpenAIKey() ? "openai" : "placeholder",
    primaryModel: hasOpenAIKey() ? "gpt-image-1" : "placeholder-svg",
    fallbackEnabled: env.OPENAI_FALLBACK_DALLE3,
  });
}
