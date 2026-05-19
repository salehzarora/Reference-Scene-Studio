import type { CharacterReference, SceneProvider } from "./scene";

export type SeriesSceneStatus = "pending" | "generating" | "ready" | "failed";

export interface SeriesScene {
  id: string;
  sceneNumber: number;
  description: string;
  promptUsed: string;
  imageUrl: string | null;
  status: SeriesSceneStatus;
  error?: string;
  provider: SceneProvider | null;
  model: string | null;
  updatedAt: string; // ISO
}

export interface SeriesProject {
  id: string;
  title: string;
  sharedCharacterReference?: CharacterReference;
  style: string; // style preset id
  aspectRatio: string; // aspect ratio id
  scenes: SeriesScene[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
