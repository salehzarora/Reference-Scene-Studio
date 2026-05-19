import { NextResponse } from "next/server";
import { generateImageSchema } from "@/lib/validators/scene";
import { getActiveProvider } from "@/lib/ai";
import { buildPrompt } from "@/lib/ai/promptBuilder";
import { getAspectRatio } from "@/lib/config/aspectRatios";
import { ProviderError } from "@/lib/ai/providers/types";
import { storeImageAny } from "@/lib/storage/imageStore";
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

  // Extract image data before building the prompt metadata object.
  // The referenceImageData is never logged or stored — used only for the
  // provider call and then discarded.
  const referenceImageData = characterReference?.referenceImageData;
  const referenceForPrompt = characterReference
    ? { name: characterReference.name, notes: characterReference.notes }
    : null;

  const finalPrompt = buildPrompt({
    description,
    stylePreset,
    aspectRatio,
    characterReference: referenceForPrompt,
    seriesContinuity: Boolean(seriesContinuity),
  });
  const provider = getActiveProvider();

  let providerImageUrl: string;
  let providerName: "openai" | "placeholder";
  let modelName: string;
  let generationMode: GenerateImageResponse["generationMode"];

  try {
    const result = await provider.generate({
      prompt: finalPrompt,
      aspectRatio: ratio,
      referenceImageData,
    });
    providerImageUrl = result.imageUrl;
    providerName = result.provider;
    modelName = result.model;
    generationMode = result.generationMode;
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

  // Persist the image to /public/uploads so localStorage only stores a URL.
  let storedUrl: string;
  try {
    const fileSlug = `${providerName}-${stylePreset}-${aspectRatio.replace(":", "x")}`;
    const stored = await storeImageAny(providerImageUrl, fileSlug);
    storedUrl = stored.imageUrl;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to persist generated image";
    return errorResponse("store_failed", message, 500);
  }

  const payload: GenerateImageResponse = {
    imageUrl: storedUrl,
    finalPrompt,
    provider: providerName,
    model: modelName,
    generationMode,
  };
  return NextResponse.json(payload);
}
