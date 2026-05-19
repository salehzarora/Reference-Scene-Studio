export type SceneStatus = "draft" | "generating" | "ready" | "failed";
export type SceneProvider = "openai" | "placeholder";

/**
 * How the scene was generated relative to any character reference.
 * - "text-only": no reference image was sent; metadata (name/notes) only used in prompt
 * - "reference-assisted": the reference image itself was sent to the provider
 * - "placeholder": placeholder provider was used (no API key)
 */
export type GenerationMode = "text-only" | "reference-assisted" | "placeholder";

/**
 * A character reference attached to a scene.
 * imageUrl is a server-side path (/uploads/...) written after upload.
 */
export interface CharacterReference {
  name: string; // may be empty
  imageUrl: string; // /uploads/... server path
  notes: string; // may be empty
}

/**
 * Portion of the character reference sent to the generate-image API.
 * referenceImageData is a base64 data URL sent only at generation time —
 * it is never persisted to localStorage.
 */
export interface CharacterReferenceForApi {
  name: string;
  notes: string;
  referenceImageData?: string; // base64 data URL, present only when reference image is sent
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
  generationMode?: GenerationMode;
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
  generationMode: GenerationMode;
}

export interface GenerateImageErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
