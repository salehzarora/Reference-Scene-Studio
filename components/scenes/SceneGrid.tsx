"use client";

import { SceneCard } from "./SceneCard";
import type { Scene } from "@/types/scene";

export function SceneGrid({ scenes }: { scenes: Scene[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {scenes.map((s) => (
        <SceneCard key={s.id} scene={s} />
      ))}
    </div>
  );
}
