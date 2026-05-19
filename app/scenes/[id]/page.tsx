"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  RefreshCw,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SceneImage } from "@/components/scenes/SceneImage";
import { SceneMetadata } from "@/components/scenes/SceneMetadata";
import { CharacterReferencePreview } from "@/components/scenes/CharacterReferencePreview";
import { useToast } from "@/components/ui/Toast";
import {
  getScene,
  saveScene,
  deleteScene,
  ScenesQuotaError,
} from "@/lib/storage/localScenes";
import type {
  GenerateImageResponse,
  GenerateImageErrorResponse,
  Scene,
} from "@/types/scene";

export default function SceneDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = React.useState(false);
  const [scene, setScene] = React.useState<Scene | null>(null);
  const [regenerating, setRegenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return;
    setScene(getScene(id) ?? null);
    setMounted(true);
  }, [params.id]);

  async function handleRegenerate() {
    if (!scene) return;
    setRegenerating(true);
    setScene({ ...scene, status: "generating" });
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: scene.description,
          stylePreset: scene.stylePreset,
          aspectRatio: scene.aspectRatio,
          characterReference: scene.characterReference
            ? {
                name: scene.characterReference.name,
                notes: scene.characterReference.notes,
              }
            : null,
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as
          | GenerateImageErrorResponse
          | null;
        const message =
          errBody?.error?.message ??
          `Regeneration failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      const data = (await res.json()) as GenerateImageResponse;
      const updated: Scene = {
        ...scene,
        finalPrompt: data.finalPrompt,
        imageUrl: data.imageUrl,
        provider: data.provider,
        model: data.model,
        status: "ready",
        errorMessage: undefined,
        updatedAt: new Date().toISOString(),
      };
      try {
        saveScene(updated);
      } catch (storageErr) {
        const message =
          storageErr instanceof ScenesQuotaError
            ? storageErr.message
            : storageErr instanceof Error
              ? storageErr.message
              : "Could not save scene locally";
        // Keep the in-memory updated scene visible but warn the user.
        setScene(updated);
        toast(message, { variant: "error" });
        return;
      }
      setScene(updated);
      toast("Scene regenerated", { variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const failed: Scene = {
        ...scene,
        status: "failed",
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      };
      try {
        saveScene(failed);
      } catch {
        // Already in an error state; skip secondary storage warning.
      }
      setScene(failed);
      toast(message, { variant: "error" });
    } finally {
      setRegenerating(false);
    }
  }

  function handleDelete() {
    if (!scene) return;
    if (!confirm("Delete this scene? This can't be undone.")) return;
    deleteScene(scene.id);
    toast("Scene deleted", { variant: "info" });
    router.push("/");
  }

  function handleCopyPrompt() {
    if (!scene?.finalPrompt) return;
    navigator.clipboard
      .writeText(scene.finalPrompt)
      .then(() => {
        setCopied(true);
        toast("Prompt copied", { variant: "success" });
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => toast("Copy failed", { variant: "error" }));
  }

  function handleDownload() {
    if (!scene?.imageUrl) return;
    const a = document.createElement("a");
    a.href = scene.imageUrl;
    a.download = `${scene.title || "scene"}-${scene.id.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!scene) {
    return (
      <EmptyState
        title="Scene not found"
        description="This scene doesn't exist, or it was created in another browser. Scenes are stored locally."
        action={
          <Link href="/">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
        }
      />
    );
  }

  const showLoading = regenerating || scene.status === "generating";
  const showError = !showLoading && scene.status === "failed";

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight truncate">
            {scene.title || "Untitled scene"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">
            {scene.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            onClick={handleRegenerate}
            loading={regenerating}
            disabled={regenerating}
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={!scene.imageUrl}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <Card>
          <CardContent>
            <SceneImage
              imageUrl={scene.imageUrl}
              aspectRatioId={scene.aspectRatio}
              loading={showLoading}
              errored={showError}
              alt={scene.title}
            />
            {showError && scene.errorMessage ? (
              <p className="mt-3 text-sm text-danger">{scene.errorMessage}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <SceneMetadata scene={scene} />
            </CardContent>
          </Card>

          {scene.characterReference ? (
            <CharacterReferencePreview reference={scene.characterReference} />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Final prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-text-secondary bg-bg-base/60 border border-border rounded-md p-3 max-h-64 overflow-y-auto">
                {scene.finalPrompt}
              </pre>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="ghost" onClick={handleCopyPrompt}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy prompt"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
