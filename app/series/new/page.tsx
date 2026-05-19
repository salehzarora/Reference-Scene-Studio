"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Film, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { StylePresetChips } from "@/components/scenes/StylePresetChips";
import { AspectRatioSelector } from "@/components/scenes/AspectRatioSelector";
import { CharacterReferenceUploader } from "@/components/scenes/CharacterReferenceUploader";
import { SceneListEditor, type DraftScene } from "@/components/series/SceneListEditor";
import { useToast } from "@/components/ui/Toast";
import { uuid } from "@/lib/utils";
import { DEFAULT_STYLE_ID } from "@/lib/config/styles";
import { DEFAULT_ASPECT_ID } from "@/lib/config/aspectRatios";
import { saveSeries, SeriesQuotaError } from "@/lib/storage/localSeries";
import type { CharacterReference } from "@/types/scene";
import type { SeriesProject, SeriesScene } from "@/types/series";

function makeDraftScene(): DraftScene {
  return { id: uuid(), description: "" };
}

export default function NewSeriesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = React.useState("");
  const [style, setStyle] = React.useState(DEFAULT_STYLE_ID);
  const [aspectRatio, setAspectRatio] = React.useState(DEFAULT_ASPECT_ID);
  const [reference, setReference] = React.useState<CharacterReference | null>(null);
  const [draftScenes, setDraftScenes] = React.useState<DraftScene[]>(() => [
    makeDraftScene(),
    makeDraftScene(),
    makeDraftScene(),
  ]);
  const [saving, setSaving] = React.useState(false);

  const validScenes = draftScenes.filter((s) => s.description.trim().length >= 4);
  const canSubmit =
    title.trim().length >= 2 && validScenes.length >= 1 && !saving;

  function handleSave() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const scenes: SeriesScene[] = validScenes.map((d, i) => ({
        id: d.id,
        sceneNumber: i + 1,
        description: d.description.trim(),
        promptUsed: "",
        imageUrl: null,
        status: "pending",
        provider: null,
        model: null,
        updatedAt: now,
      }));
      const series: SeriesProject = {
        id: uuid(),
        title: title.trim(),
        sharedCharacterReference: reference ?? undefined,
        style,
        aspectRatio,
        scenes,
        createdAt: now,
        updatedAt: now,
      };
      saveSeries(series);
      toast("Series created", { variant: "success" });
      router.push(`/series/${series.id}`);
    } catch (err) {
      if (err instanceof SeriesQuotaError) {
        toast(err.message, { variant: "error" });
      } else {
        toast(
          err instanceof Error ? err.message : "Could not save series",
          { variant: "error" },
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-wider text-text-muted">
          Stage 3 · Scene Series
        </div>
        <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">
          Create Series
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">
          A series shares one character reference, style, and aspect ratio
          across multiple scenes. Continuity instructions are added to every
          scene&rsquo;s prompt so the character stays consistent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Series details</CardTitle>
              <CardDescription>
                Title shows on the dashboard and detail page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-text-muted">
                  Series title <span className="text-danger">*</span>
                </label>
                <Input
                  className="mt-2"
                  placeholder="e.g. Blopi hangs a picture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shared character reference (optional)</CardTitle>
              <CardDescription>
                Locks the main subject across every scene in this series.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CharacterReferenceUploader
                value={reference}
                onChange={setReference}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shared style</CardTitle>
              <CardDescription>
                Applied to every scene in this series.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StylePresetChips value={style} onChange={setStyle} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shared aspect ratio</CardTitle>
              <CardDescription>
                Applied to every scene in this series.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AspectRatioSelector
                value={aspectRatio}
                onChange={setAspectRatio}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scenes</CardTitle>
              <CardDescription>
                Add one description per scene. Scenes can be generated
                individually or all at once from the series page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SceneListEditor
                scenes={draftScenes}
                onChange={setDraftScenes}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              {validScenes.length} of {draftScenes.length} scenes ready to save.
            </p>
            <Button size="lg" onClick={handleSave} disabled={!canSubmit} loading={saving}>
              <Save className="h-4 w-4" />
              Save series
            </Button>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                A quick read of what will be saved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow label="Title" value={title || <Muted>—</Muted>} />
              <SummaryRow label="Style" value={style} />
              <SummaryRow label="Aspect" value={aspectRatio} />
              <SummaryRow
                label="Reference"
                value={
                  reference
                    ? reference.name || "(unnamed)"
                    : <Muted>None</Muted>
                }
              />
              <SummaryRow
                label="Scenes"
                value={`${validScenes.length} / ${draftScenes.length}`}
              />
              <div className="pt-2 flex items-center gap-2 text-xs text-text-muted">
                <Film className="h-3.5 w-3.5 text-accent" />
                Continuity instruction is applied to every scene&rsquo;s prompt.
              </div>
            </CardContent>
          </Card>

          {reference?.imageUrl ? (
            <Card>
              <CardHeader>
                <CardTitle>Shared reference</CardTitle>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reference.imageUrl}
                  alt={reference.name || "Character reference"}
                  className="w-full max-h-56 object-contain rounded-md border border-border bg-bg-base"
                />
                {reference.notes ? (
                  <p className="mt-2 text-xs text-text-secondary leading-relaxed line-clamp-4">
                    {reference.notes}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className="text-text-primary text-right">{value}</span>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-text-muted italic">{children}</span>;
}
