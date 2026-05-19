"use client";

import Link from "next/link";
import { Film, UserSquare2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SceneImage } from "@/components/scenes/SceneImage";
import { formatDate, truncate } from "@/lib/utils";
import { getStylePreset } from "@/lib/config/styles";
import type { SeriesProject } from "@/types/series";

export function SeriesCard({ series }: { series: SeriesProject }) {
  const style = getStylePreset(series.style);
  const total = series.scenes.length;
  const ready = series.scenes.filter((s) => s.status === "ready").length;
  const failed = series.scenes.filter((s) => s.status === "failed").length;
  const hasRef = Boolean(series.sharedCharacterReference);
  const cover =
    series.scenes.find((s) => s.imageUrl)?.imageUrl ??
    series.sharedCharacterReference?.imageUrl ??
    null;

  return (
    <Link
      href={`/series/${series.id}`}
      className="group block rounded-lg border border-border bg-bg-surface hover:bg-bg-hover/50 hover:border-border-strong transition-colors overflow-hidden focus-ring"
    >
      <div className="relative">
        <SceneImage
          imageUrl={cover}
          aspectRatioId={series.aspectRatio}
          className="rounded-none border-0 border-b border-border"
        />
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-bg-base/80 border border-accent/30 px-1.5 py-0.5 text-[10px] font-medium text-accent backdrop-blur">
          <Film className="h-3 w-3" />
          SERIES · {total}
        </span>
        {hasRef ? (
          <span
            className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-bg-base/80 border border-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary backdrop-blur"
            title={`Shared reference: ${series.sharedCharacterReference?.name || "unnamed"}`}
          >
            <UserSquare2 className="h-3 w-3" />
            REF
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-primary leading-snug">
            {series.title || "Untitled series"}
          </h3>
          <Badge
            variant={
              ready === total && total > 0
                ? "success"
                : failed > 0
                  ? "danger"
                  : "neutral"
            }
          >
            {ready}/{total} ready
          </Badge>
        </div>
        <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
          {truncate(
            series.scenes
              .map((s, i) => `${i + 1}. ${s.description}`)
              .join(" · "),
            120,
          )}
        </p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-2">
            <span>{series.aspectRatio}</span>
            <span>·</span>
            <span>{style?.label ?? series.style}</span>
            {ready === total && total > 0 ? (
              <>
                <span>·</span>
                <CheckCircle2 className="h-3 w-3 text-success" />
              </>
            ) : null}
          </div>
          <span>{formatDate(series.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
