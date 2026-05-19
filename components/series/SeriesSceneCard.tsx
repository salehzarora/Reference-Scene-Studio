"use client";

import * as React from "react";
import {
  Wand2,
  RefreshCw,
  Trash2,
  ChevronDown,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { SceneImage } from "@/components/scenes/SceneImage";
import { cn } from "@/lib/utils";
import type { SeriesScene } from "@/types/series";

interface Props {
  scene: SeriesScene;
  aspectRatioId: string;
  onGenerate: () => void;
  onDescriptionBlur: (next: string) => void;
  onRemove: () => void;
  busy?: boolean;
}

export function SeriesSceneCard({
  scene,
  aspectRatioId,
  onGenerate,
  onDescriptionBlur,
  onRemove,
  busy,
}: Props) {
  const [description, setDescription] = React.useState(scene.description);
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setDescription(scene.description);
  }, [scene.description]);

  const showLoading = scene.status === "generating" || busy;
  const showError = !showLoading && scene.status === "failed";
  const hasImage = Boolean(scene.imageUrl);

  function handleCopy() {
    if (!scene.promptUsed) return;
    navigator.clipboard.writeText(scene.promptUsed).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDownload() {
    if (!scene.imageUrl) return;
    const a = document.createElement("a");
    a.href = scene.imageUrl;
    a.download = `scene-${scene.sceneNumber}-${scene.id.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
          <div>
            <SceneImage
              imageUrl={scene.imageUrl}
              aspectRatioId={aspectRatioId}
              loading={showLoading}
              errored={showError}
            />
          </div>

          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md border border-accent/40 bg-accent/10 px-1.5 text-xs font-semibold text-accent">
                  #{scene.sceneNumber}
                </span>
                <Badge
                  variant={
                    scene.status === "ready"
                      ? "success"
                      : scene.status === "failed"
                        ? "danger"
                        : scene.status === "generating"
                          ? "warning"
                          : "neutral"
                  }
                >
                  {scene.status}
                </Badge>
              </div>
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted hover:text-danger transition-colors"
                title="Remove scene from series"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted">
                Description
              </label>
              <Textarea
                className="mt-1.5 min-h-[88px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => onDescriptionBlur(description)}
                placeholder="Describe what happens in this scene…"
                maxLength={2000}
              />
            </div>

            {showError && scene.error ? (
              <p className="text-xs text-danger">{scene.error}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={onGenerate}
                loading={showLoading}
                disabled={showLoading || description.trim().length < 4}
              >
                {hasImage ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" />
                    Generate
                  </>
                )}
              </Button>

              {hasImage ? (
                <Button size="sm" variant="ghost" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              ) : null}

              <button
                type="button"
                onClick={() => setPromptOpen((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors",
                )}
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    promptOpen && "rotate-180",
                  )}
                />
                {scene.promptUsed ? "Prompt used" : "No prompt yet"}
              </button>
            </div>

            {promptOpen ? (
              <div className="rounded-md border border-border bg-bg-base/60 p-3">
                {scene.promptUsed ? (
                  <>
                    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-text-secondary max-h-48 overflow-y-auto">
                      {scene.promptUsed}
                    </pre>
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" variant="ghost" onClick={handleCopy}>
                        {copied ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-text-muted italic">
                    Generate this scene to see the prompt that will be used.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
