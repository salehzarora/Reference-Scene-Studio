"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { SceneImage } from "@/components/scenes/SceneImage";
import { formatDate, truncate } from "@/lib/utils";
import { getStylePreset } from "@/lib/config/styles";
import type { Scene } from "@/types/scene";

export function SceneCard({ scene }: { scene: Scene }) {
  const style = getStylePreset(scene.stylePreset);
  return (
    <Link
      href={`/scenes/${scene.id}`}
      className="group block rounded-lg border border-border bg-bg-surface hover:bg-bg-hover/50 hover:border-border-strong transition-colors overflow-hidden focus-ring"
    >
      <SceneImage
        imageUrl={scene.imageUrl}
        aspectRatioId={scene.aspectRatio}
        errored={scene.status === "failed"}
        loading={scene.status === "generating"}
        className="rounded-none border-0 border-b border-border"
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-primary leading-snug">
            {scene.title || "Untitled scene"}
          </h3>
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
        <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
          {truncate(scene.description, 110)}
        </p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-2">
            <span>{scene.aspectRatio}</span>
            <span>·</span>
            <span>{style?.label ?? scene.stylePreset}</span>
          </div>
          <span>{formatDate(scene.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
