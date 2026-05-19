export type SceneStatus = "draft" | "generating" | "ready" | "failed";
export type SceneProvider = "openai" | "placeholder";

/**
 * A character reference attached to a scene.
 * imageUrl is a compressed data URI stored client-side (localStorage only).
 */
export interface CharacterReference {
  name: string; // may be empty
  imageUrl: string; // data URI
  notes: string; // may be empty
}

/**
 * Portion of the character reference sent to the server. The raw image is
 * not transmitted because the text-to-image endpoint can't use it; the
 * prompt builder needs only name + notes to compose reference instructions.
 */
export interface CharacterReferenceForApi {
  name: string;
  notes: string;
}

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
  characterReference?: CharacterReference;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface GenerateImageInput {
  description: string;
  stylePreset: string;
  aspectRatio: string;
  characterReference?: CharacterReferenceForApi | null;
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
