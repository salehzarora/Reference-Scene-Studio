export type SceneStatus = "draft" | "generating" | "ready" | "failed";
export type SceneProvider = "openai" | "placeholder";

export interface Scene {
  id: string;
  title: string;
  description: string;
  finalPrompt: string;
  stylePreset: string;
  aspectRatio: string;
  imageUrl: string | null;
  status: SceneStatus;
  provider: SceneProvider;
  model: string | null;
  errorMessage?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface GenerateImageInput {
  description: string;
  stylePreset: string;
  aspectRatio: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
  finalPrompt: string;
  provider: SceneProvider;
  model: string;
}

export interface GenerateImageErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
