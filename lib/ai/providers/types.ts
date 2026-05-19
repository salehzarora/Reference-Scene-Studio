import "server-only";
import type { AspectRatio } from "@/lib/config/aspectRatios";

export interface GenerateInput {
  prompt: string;
  aspectRatio: AspectRatio;
}

export interface GenerateResult {
  imageUrl: string;
  provider: "openai" | "placeholder";
  model: string;
  latencyMs: number;
}

export interface ImageProvider {
  name: "openai" | "placeholder";
  generate(input: GenerateInput): Promise<GenerateResult>;
}

export class ProviderError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
