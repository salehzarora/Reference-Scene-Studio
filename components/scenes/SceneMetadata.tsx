"use client";

import { Badge } from "@/components/ui/Badge";
import { BadgeCheck, FileText, Image } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getStylePreset } from "@/lib/config/styles";
import type { Scene } from "@/types/scene";

export function SceneMetadata({ scene }: { scene: Scene }) {
  const style = getStylePreset(scene.stylePreset);
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
      <Field label="Status">
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
      </Field>
      <Field label="Provider">
        <Badge variant={scene.provider === "openai" ? "accent" : "outline"}>
          {scene.provider}
          {scene.model ? ` · ${scene.model}` : ""}
        </Badge>
      </Field>
      <Field label="Aspect Ratio">{scene.aspectRatio}</Field>
      <Field label="Style">{style?.label ?? scene.stylePreset}</Field>
      {scene.generationMode ? (
        <Field label="Generation">
          {scene.generationMode === "reference-assisted" ? (
            <Badge variant="accent">
              <BadgeCheck className="h-3 w-3 mr-1" />
              Reference image used
            </Badge>
          ) : scene.generationMode === "text-only" ? (
            <Badge variant="outline">
              <FileText className="h-3 w-3 mr-1" />
              Reference as text only
            </Badge>
          ) : (
            <Badge variant="neutral">
              <Image className="h-3 w-3 mr-1" />
              Placeholder
            </Badge>
          )}
        </Field>
      ) : null}
      <Field label="Created">{formatDate(scene.createdAt)}</Field>
      <Field label="Updated">{formatDate(scene.updatedAt)}</Field>
    </dl>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-text-primary">{children}</dd>
    </div>
  );
}
