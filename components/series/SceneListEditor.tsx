"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export interface DraftScene {
  id: string;
  description: string;
}

interface Props {
  scenes: DraftScene[];
  onChange: (next: DraftScene[]) => void;
  maxScenes?: number;
}

export function SceneListEditor({ scenes, onChange, maxScenes = 20 }: Props) {
  function updateScene(id: string, description: string) {
    onChange(
      scenes.map((s) => (s.id === id ? { ...s, description } : s)),
    );
  }

  function removeScene(id: string) {
    if (scenes.length <= 1) return;
    onChange(scenes.filter((s) => s.id !== id));
  }

  function addScene() {
    if (scenes.length >= maxScenes) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : "s-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    onChange([...scenes, { id, description: "" }]);
  }

  return (
    <div className="space-y-3">
      {scenes.map((scene, i) => (
        <div
          key={scene.id}
          className="rounded-md border border-border bg-bg-elevated p-3"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-6 min-w-[2.25rem] shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/10 px-1.5 text-xs font-semibold text-accent">
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <Textarea
                placeholder={
                  i === 0
                    ? "e.g. Blopi walks to the wall holding a picture frame and hammer."
                    : "Describe scene…"
                }
                value={scene.description}
                onChange={(e) => updateScene(scene.id, e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>
            <button
              type="button"
              onClick={() => removeScene(scene.id)}
              disabled={scenes.length <= 1}
              className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:text-danger transition-colors disabled:opacity-30 disabled:hover:text-text-muted"
              title="Remove scene"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-muted">
          {scenes.length} scene{scenes.length === 1 ? "" : "s"} ·{" "}
          {maxScenes - scenes.length} more allowed
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addScene}
          disabled={scenes.length >= maxScenes}
        >
          <Plus className="h-3.5 w-3.5" />
          Add scene
        </Button>
      </div>
    </div>
  );
}
