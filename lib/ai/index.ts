import "server-only";
import { hasOpenAIKey } from "@/lib/config/env";
import { placeholderProvider } from "./providers/placeholder";
import { openaiProvider } from "./providers/openai";
import type { ImageProvider } from "./providers/types";

/**
 * Returns the active image provider based on environment configuration.
 * - If OPENAI_API_KEY is set, use OpenAI (gpt-image-1).
 * - Otherwise, fall back to the placeholder provider.
 */
export function getActiveProvider(): ImageProvider {
  return hasOpenAIKey() ? openaiProvider : placeholderProvider;
}

export { placeholderProvider, openaiProvider };
export type { ImageProvider } from "./providers/types";
