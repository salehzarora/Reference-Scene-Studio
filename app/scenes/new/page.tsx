"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StylePresetChips } from "@/components/scenes/StylePresetChips";
import { AspectRatioSelector } from "@/components/scenes/AspectRatioSelector";
import { SceneImage } from "@/components/scenes/SceneImage";
import { useToast } from "@/components/ui/Toast";
import { saveScene } from "@/lib/storage/localScenes";
import { uuid, truncate } from "@/lib/utils";
import { DEFAULT_STYLE_ID } from "@/lib/config/styles";
import { DEFAULT_ASPECT_ID } from "@/lib/config/aspectRatios";
import type {
  GenerateImageResponse,
  GenerateImageErrorResponse,
  Scene,
} from "@/types/scene";

export default function NewScenePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [stylePreset, setStylePreset] = React.useState(DEFAULT_STYLE_ID);
  const [aspectRatio, setAspectRatio] = React.useState(DEFAULT_ASPECT_ID);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const canSubmit = description.trim().length >= 4 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          stylePreset,
          aspectRatio,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as
          | GenerateImageErrorResponse
          | null;
        const message =
          errBody?.error?.message ??
          `Generation failed (HTTP ${res.status})`;
        throw new Error(message);
      }

      const data = (await res.json()) as GenerateImageResponse;
      const now = new Date().toISOString();
      const scene: Scene = {
        id: uuid(),
        title: title.trim() || truncate(description.trim(), 60),
        description: description.trim(),
        finalPrompt: data.finalPrompt,
        stylePreset,
        aspectRatio,
        imageUrl: data.imageUrl,
        status: "ready",
        provider: data.provider,
        model: data.model,
        createdAt: now,
        updatedAt: now,
      };
      saveScene(scene);
      toast("Scene generated", { variant: "success" });
      router.push(`/scenes/${scene.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(message);
      toast(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Submit on Cmd/Ctrl+Enter from textarea.
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-wider text-text-muted">
          Stage 1
        </div>
        <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">
          New Scene
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">
          Describe what you want to see. The system builds a final prompt by
          combining your description with the selected style and aspect ratio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scene description</CardTitle>
              <CardDescription>
                What is happening, who is in frame, the mood, the camera.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-text-muted">
                  Title (optional)
                </label>
                <Input
                  className="mt-2"
                  placeholder="e.g. Rainy alley confrontation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-text-muted">
                  Description <span className="text-danger">*</span>
                </label>
                <Textarea
                  className="mt-2"
                  placeholder="A lone detective in a long coat stands at the end of a rain-soaked alley at night. Neon signs reflect in puddles. Low angle, wide shot, atmospheric fog."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={2000}
                  rows={6}
                />
                <div className="mt-1.5 flex justify-between text-[11px] text-text-muted">
                  <span>Press ⌘/Ctrl + Enter to generate</span>
                  <span>{description.length}/2000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Style preset</CardTitle>
              <CardDescription>
                The style adds visual modifiers on top of your description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StylePresetChips value={stylePreset} onChange={setStylePreset} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aspect ratio</CardTitle>
              <CardDescription>
                Maps to a supported model size (gpt-image-1).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
            </CardContent>
          </Card>

          {errorMsg ? (
            <Card className="border-danger/40 bg-danger/10">
              <CardContent className="py-3">
                <p className="text-sm text-danger">{errorMsg}</p>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex items-center justify-end">
            <Button
              size="lg"
              onClick={handleGenerate}
              loading={loading}
              disabled={!canSubmit}
            >
              {loading ? (
                <>Generating…</>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate image
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Live preview of the selected aspect ratio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SceneImage
                imageUrl={null}
                aspectRatioId={aspectRatio}
                loading={loading}
              />
              <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>
                  {loading
                    ? "Generating with the active provider…"
                    : "Press Generate to render this scene."}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
