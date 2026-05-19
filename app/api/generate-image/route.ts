import { NextResponse } from "next/server";
import { generateImageSchema } from "@/lib/validators/scene";
import { getActiveProvider } from "@/lib/ai";
import { buildPrompt } from "@/lib/ai/promptBuilder";
import { getAspectRatio } from "@/lib/config/aspectRatios";
import { ProviderError } from "@/lib/ai/providers/types";
import type { GenerateImageResponse } from "@/types/scene";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// OpenAI image gen can take a while. Allow up to ~90s on Node runtime.
export const maxDuration = 90;

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return errorResponse("invalid_json", "Request body must be JSON", 400);
  }

  const parsed = generateImageSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return errorResponse(
      "validation_error",
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      400,
    );
  }

  const {
    description,
    stylePreset,
    aspectRatio,
    characterReference,
    seriesContinuity,
  } = parsed.data;
  const ratio = getAspectRatio(aspectRatio);
  if (!ratio) {
    return errorResponse("invalid_aspect", "Unknown aspect ratio", 400);
  }

  const finalPrompt = buildPrompt({
    description,
    stylePreset,
    aspectRatio,
    characterReference: characterReference ?? null,
    seriesContinuity: Boolean(seriesContinuity),
  });
  const provider = getActiveProvider();

  try {
    const result = await provider.generate({
      prompt: finalPrompt,
      aspectRatio: ratio,
    });
    const payload: GenerateImageResponse = {
      imageUrl: result.imageUrl,
      finalPrompt,
      provider: result.provider,
      model: result.model,
    };
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof ProviderError) {
      return errorResponse(
        err.code,
        err.message,
        err.status >= 400 ? err.status : 500,
      );
    }
    const message =
      err instanceof Error ? err.message : "Unexpected provider error";
    return errorResponse("provider_error", message, 500);
  }
}
