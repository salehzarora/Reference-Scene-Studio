"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  PlayCircle,
  Plus,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CharacterReferencePreview } from "@/components/scenes/CharacterReferencePreview";
import { SeriesSceneCard } from "@/components/series/SeriesSceneCard";
import { useToast } from "@/components/ui/Toast";
import {
  getSeries,
  saveSeries,
  deleteSeries,
  updateSeriesScene,
  SeriesQuotaError,
} from "@/lib/storage/localSeries";
import { uuid, formatDate } from "@/lib/utils";
import { getStylePreset } from "@/lib/config/styles";
import type {
  GenerateImageResponse,
  GenerateImageErrorResponse,
} from "@/types/scene";
import type { SeriesProject, SeriesScene } from "@/types/series";

export default function SeriesDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = React.useState(false);
  const [series, setSeries] = React.useState<SeriesProject | null>(null);
  const [busySceneIds, setBusySceneIds] = React.useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const bulkAbort = React.useRef(false);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  React.useEffect(() => {
    if (!id) return;
    setSeries(getSeries(id) ?? null);
    setMounted(true);
  }, [id]);

  function persist(next: SeriesProject) {
    try {
      saveSeries(next);
    } catch (err) {
      if (err instanceof SeriesQuotaError) {
        toast(err.message, { variant: "error" });
      } else {
        toast(
          err instanceof Error ? err.message : "Could not save series",
          { variant: "error" },
        );
      }
    }
    setSeries(next);
  }

  function tryUpdateScene(
    sceneId: string,
    patch: Parameters<typeof updateSeriesScene>[2],
  ): SeriesProject | undefined {
    if (!series) return undefined;
    try {
      return updateSeriesScene(series.id, sceneId, patch);
    } catch (err) {
      const message =
        err instanceof SeriesQuotaError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save scene update";
      toast(message, { variant: "error" });
      return undefined;
    }
  }

  async function generateScene(sceneId: string): Promise<boolean> {
    if (!series) return false;
    const target = series.scenes.find((s) => s.id === sceneId);
    if (!target) return false;

    setBusySceneIds((prev) => {
      const next = new Set(prev);
      next.add(sceneId);
      return next;
    });

    // Optimistic update.
    const optimistic = tryUpdateScene(sceneId, {
      status: "generating",
      error: undefined,
    });
    if (optimistic) setSeries(optimistic);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: target.description,
          stylePreset: series.style,
          aspectRatio: series.aspectRatio,
          characterReference: series.sharedCharacterReference
            ? {
                name: series.sharedCharacterReference.name,
                notes: series.sharedCharacterReference.notes,
              }
            : null,
          seriesContinuity: true,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as
          | GenerateImageErrorResponse
          | null;
        const message =
          errBody?.error?.message ?? `Generation failed (HTTP ${res.status})`;
        throw new Error(message);
      }

      const data = (await res.json()) as GenerateImageResponse;
      const updated = tryUpdateScene(sceneId, {
        status: "ready",
        imageUrl: data.imageUrl,
        promptUsed: data.finalPrompt,
        provider: data.provider,
        model: data.model,
        error: undefined,
      });
      if (updated) setSeries(updated);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const failed = tryUpdateScene(sceneId, {
        status: "failed",
        error: message,
      });
      if (failed) setSeries(failed);
      toast(`Scene #${target.sceneNumber}: ${message}`, { variant: "error" });
      return false;
    } finally {
      setBusySceneIds((prev) => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  }

  async function handleGenerateAllPending() {
    if (!series || bulkRunning) return;
    const targets = series.scenes.filter(
      (s) => s.status === "pending" || s.status === "failed",
    );
    if (targets.length === 0) {
      toast("Nothing pending to generate", { variant: "info" });
      return;
    }
    setBulkRunning(true);
    bulkAbort.current = false;
    let okCount = 0;
    for (const scene of targets) {
      if (bulkAbort.current) break;
      const ok = await generateScene(scene.id);
      if (ok) okCount += 1;
    }
    setBulkRunning(false);
    toast(`Generated ${okCount} / ${targets.length} scenes`, {
      variant: okCount === targets.length ? "success" : "info",
    });
  }

  function handleStopBulk() {
    bulkAbort.current = true;
    setBulkRunning(false);
    toast("Will stop after the current scene", { variant: "info" });
  }

  function handleDescriptionBlur(sceneId: string, description: string) {
    if (!series) return;
    const trimmed = description.trim();
    const target = series.scenes.find((s) => s.id === sceneId);
    if (!target || target.description === trimmed) return;
    const updated = tryUpdateScene(sceneId, {
      description: trimmed,
    });
    if (updated) setSeries(updated);
  }

  function handleAddScene() {
    if (!series) return;
    const now = new Date().toISOString();
    const newScene: SeriesScene = {
      id: uuid(),
      sceneNumber: series.scenes.length + 1,
      description: "",
      promptUsed: "",
      imageUrl: null,
      status: "pending",
      provider: null,
      model: null,
      updatedAt: now,
    };
    persist({
      ...series,
      scenes: [...series.scenes, newScene],
      updatedAt: now,
    });
  }

  function handleRemoveScene(sceneId: string) {
    if (!series) return;
    if (series.scenes.length <= 1) {
      toast("A series needs at least one scene", { variant: "info" });
      return;
    }
    if (!confirm("Remove this scene from the series?")) return;
    const filtered = series.scenes
      .filter((s) => s.id !== sceneId)
      .map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    persist({
      ...series,
      scenes: filtered,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDeleteSeries() {
    if (!series) return;
    if (!confirm("Delete this series? This can't be undone.")) return;
    deleteSeries(series.id);
    toast("Series deleted", { variant: "info" });
    router.push("/");
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!series) {
    return (
      <EmptyState
        title="Series not found"
        description="This series doesn't exist, or it was created in another browser. Series are stored locally."
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

  const total = series.scenes.length;
  const ready = series.scenes.filter((s) => s.status === "ready").length;
  const pending = series.scenes.filter(
    (s) => s.status === "pending" || s.status === "failed",
  ).length;
  const style = getStylePreset(series.style);

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
          <div className="mt-2 flex items-center gap-2">
            <Film className="h-5 w-5 text-accent" />
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight truncate">
              {series.title}
            </h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <Badge variant="accent">{total} scenes</Badge>
            <Badge variant={ready === total ? "success" : "neutral"}>
              {ready}/{total} ready
            </Badge>
            <span>·</span>
            <span>{series.aspectRatio}</span>
            <span>·</span>
            <span>{style?.label ?? series.style}</span>
            <span>·</span>
            <span>Created {formatDate(series.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {bulkRunning ? (
            <Button variant="secondary" onClick={handleStopBulk}>
              Stop after current
            </Button>
          ) : (
            <Button
              onClick={handleGenerateAllPending}
              disabled={pending === 0}
              loading={bulkRunning}
            >
              <PlayCircle className="h-4 w-4" />
              Generate all pending ({pending})
            </Button>
          )}
          <Button variant="danger" onClick={handleDeleteSeries}>
            <Trash2 className="h-4 w-4" />
            Delete series
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-4 min-w-0">
          {series.scenes.map((scene) => (
            <SeriesSceneCard
              key={scene.id}
              scene={scene}
              aspectRatioId={series.aspectRatio}
              onGenerate={() => generateScene(scene.id)}
              onDescriptionBlur={(next) => handleDescriptionBlur(scene.id, next)}
              onRemove={() => handleRemoveScene(scene.id)}
              busy={busySceneIds.has(scene.id)}
            />
          ))}

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={handleAddScene}>
              <Plus className="h-3.5 w-3.5" />
              Add scene
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {series.sharedCharacterReference ? (
            <CharacterReferencePreview
              reference={series.sharedCharacterReference}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No shared reference</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  This series has no shared character reference. Add one in a
                  future revision to lock the subject across scenes.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Continuity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-secondary leading-relaxed">
                Every scene&rsquo;s prompt automatically includes a continuity
                instruction so the model treats the character identity,
                proportions, texture, colors, and overall style as fixed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
