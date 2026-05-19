"use client";

import { cn } from "@/lib/utils";
import { getAspectRatio } from "@/lib/config/aspectRatios";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageIcon, AlertCircle } from "lucide-react";

interface Props {
  imageUrl: string | null;
  aspectRatioId: string;
  loading?: boolean;
  errored?: boolean;
  alt?: string;
  className?: string;
}

export function SceneImage({
  imageUrl,
  aspectRatioId,
  loading,
  errored,
  alt = "Generated scene",
  className,
}: Props) {
  const ratio = getAspectRatio(aspectRatioId);
  const cssAspect = ratio?.cssAspect ?? "16 / 9";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-bg-elevated",
        className,
      )}
      style={{ aspectRatio: cssAspect }}
    >
      {loading ? (
        <Skeleton className="absolute inset-0 rounded-none" />
      ) : errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-6 text-danger">
          <AlertCircle className="h-6 w-6" />
          <div className="text-sm">Generation failed</div>
        </div>
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted">
          <ImageIcon className="h-6 w-6" />
          <div className="text-xs">No image yet</div>
        </div>
      )}
    </div>
  );
}
