import "server-only";
import { env } from "@/lib/config/env";
import {
  type ImageProvider,
  type GenerateInput,
  type GenerateResult,
  ProviderError,
} from "./types";

const OPENAI_GENERATIONS_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";
const PRIMARY_MODEL = "gpt-image-1";
const FALLBACK_MODEL = "dall-e-3";

async function callOpenAI(
  model: string,
  prompt: string,
  size: string,
): Promise<{ imageUrl: string }> {
  // gpt-image-1 returns b64_json by default and does NOT accept response_format.
  // dall-e-3 returns a URL by default. We handle both response shapes below.
  const body: Record<string, unknown> = {
    model,
    prompt,
    size,
    n: 1,
  };

  const res = await fetch(OPENAI_GENERATIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const { code, msg } = await parseOpenAIError(res);
    throw new ProviderError(code, msg, res.status);
  }

  return extractImageUrl(await res.json());
}

/**
 * Calls the OpenAI image edits endpoint with a reference image.
 * gpt-image-1 supports multi-image edits; dall-e-2 also uses this endpoint
 * but is NOT used here. If this endpoint is unavailable (model_not_found),
 * the caller should surface a clear error rather than silently falling back.
 *
 * TODO: If OpenAI edits does not preserve character identity well enough,
 * switch to Replicate (e.g. FLUX with IP-Adapter) or fal.ai (e.g. fal-ai/flux/dev)
 * which are purpose-built for reference-consistent image generation.
 * Adapter: implement lib/ai/providers/replicate.ts or lib/ai/providers/fal.ts
 * following the same ImageProvider interface.
 */
async function callOpenAIEdits(
  prompt: string,
  size: string,
  referenceImageData: string,
): Promise<{ imageUrl: string }> {
  const commaIdx = referenceImageData.indexOf(",");
  if (commaIdx === -1) {
    throw new ProviderError(
      "invalid_reference",
      "Reference image data URL is malformed",
      400,
    );
  }
  const meta = referenceImageData.slice(0, commaIdx); // e.g. "data:image/jpeg;base64"
  const b64 = referenceImageData.slice(commaIdx + 1);
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const ext = mime.split("/")[1]?.split("+")[0] ?? "jpg";

  const buffer = Buffer.from(b64, "base64");
  const blob = new Blob([buffer], { type: mime });

  const form = new FormData();
  form.append("image", blob, `reference.${ext}`);
  form.append("prompt", prompt);
  form.append("model", PRIMARY_MODEL);
  form.append("size", size);
  form.append("n", "1");

  const res = await fetch(OPENAI_EDITS_URL, {
    method: "POST",
    headers: {
      // Do NOT set Content-Type — fetch sets it with the multipart boundary automatically.
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: form,
    cache: "no-store",
  });

  if (!res.ok) {
    const { code, msg } = await parseOpenAIError(res);
    throw new ProviderError(code, `Reference generation failed: ${msg}`, res.status);
  }

  return extractImageUrl(await res.json());
}

async function parseOpenAIError(
  res: Response,
): Promise<{ code: string; msg: string }> {
  let msg = `OpenAI request failed (${res.status})`;
  let code = "openai_error";
  try {
    const errBody = (await res.json()) as {
      error?: { message?: string; code?: string; type?: string };
    };
    if (errBody?.error?.message) msg = errBody.error.message;
    if (errBody?.error?.code) code = errBody.error.code;
    else if (errBody?.error?.type) code = errBody.error.type;
  } catch {
    // ignore — use defaults
  }
  return { code, msg };
}

function extractImageUrl(data: unknown): { imageUrl: string } {
  const d = data as { data?: Array<{ url?: string; b64_json?: string }> };
  const first = d.data?.[0];
  if (!first) {
    throw new ProviderError("empty_response", "OpenAI returned no image data");
  }
  if (first.b64_json) {
    return { imageUrl: `data:image/png;base64,${first.b64_json}` };
  }
  if (first.url) {
    return { imageUrl: first.url };
  }
  throw new ProviderError(
    "unexpected_response",
    "OpenAI response had neither url nor b64_json",
  );
}

export const openaiProvider: ImageProvider = {
  name: "openai",
  async generate(input: GenerateInput): Promise<GenerateResult> {
    if (!env.OPENAI_API_KEY) {
      throw new ProviderError(
        "missing_key",
        "OPENAI_API_KEY is not configured",
        500,
      );
    }
    const start = Date.now();
    const size = input.aspectRatio.openaiSize;

    // --- Reference-assisted path ---
    if (input.referenceImageData) {
      // Use the image edits endpoint so the reference image is sent as actual
      // pixel data, not just described in the prompt.
      // We do NOT silently fall back to text-only if this fails — the caller
      // returns a clear error so the user knows what happened.
      const { imageUrl } = await callOpenAIEdits(
        input.prompt,
        size,
        input.referenceImageData,
      );
      return {
        imageUrl,
        provider: "openai",
        model: PRIMARY_MODEL,
        latencyMs: Date.now() - start,
        generationMode: "reference-assisted",
      };
    }

    // --- Text-only path ---
    try {
      const { imageUrl } = await callOpenAI(PRIMARY_MODEL, input.prompt, size);
      return {
        imageUrl,
        provider: "openai",
        model: PRIMARY_MODEL,
        latencyMs: Date.now() - start,
        generationMode: "text-only",
      };
    } catch (err) {
      if (env.OPENAI_FALLBACK_DALLE3 && err instanceof ProviderError) {
        // Only fall back on model-level errors (not auth/network).
        const isModelError =
          err.code === "model_not_found" ||
          err.code === "invalid_request_error" ||
          err.status === 400 ||
          err.status === 404;
        if (isModelError) {
          // dall-e-3 supports 1024x1024, 1792x1024, 1024x1792.
          const dalleSize =
            size === "1536x1024"
              ? "1792x1024"
              : size === "1024x1536"
                ? "1024x1792"
                : "1024x1024";
          const { imageUrl } = await callOpenAI(
            FALLBACK_MODEL,
            input.prompt,
            dalleSize,
          );
          return {
            imageUrl,
            provider: "openai",
            model: FALLBACK_MODEL,
            latencyMs: Date.now() - start,
            generationMode: "text-only",
          };
        }
      }
      throw err;
    }
  },
};
