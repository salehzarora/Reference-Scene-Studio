import "server-only";
import { env } from "@/lib/config/env";
import {
  type ImageProvider,
  type GenerateInput,
  type GenerateResult,
  ProviderError,
} from "./types";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
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

  const res = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
    // OpenAI image gen can be slow; allow up to ~60s.
    cache: "no-store",
  });

  if (!res.ok) {
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
      // ignore
    }
    throw new ProviderError(code, msg, res.status);
  }

  const data = (await res.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };
  const first = data.data?.[0];
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

    try {
      const { imageUrl } = await callOpenAI(PRIMARY_MODEL, input.prompt, size);
      return {
        imageUrl,
        provider: "openai",
        model: PRIMARY_MODEL,
        latencyMs: Date.now() - start,
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
          };
        }
      }
      throw err;
    }
  },
};
