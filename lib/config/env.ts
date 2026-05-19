// Server-only typed env access.
// Never import this file from a client component.

import "server-only";

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.trim() || "",
  OPENAI_FALLBACK_DALLE3: readBool(process.env.OPENAI_FALLBACK_DALLE3, false),
};

export function hasOpenAIKey(): boolean {
  return env.OPENAI_API_KEY.length > 0;
}
