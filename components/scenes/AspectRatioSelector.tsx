"use client";

import { ASPECT_RATIOS } from "@/lib/config/aspectRatios";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export function AspectRatioSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {ASPECT_RATIOS.map((r) => {
        const active = r.id === value;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-md border transition-colors focus-ring",
              active
                ? "bg-accent/12 border-accent/40"
                : "bg-bg-elevated border-border hover:border-border-strong",
            )}
          >
            <div
              className={cn(
                "w-12 rounded-sm border",
                active ? "border-accent/60 bg-accent/15" : "border-border-strong bg-bg-base",
              )}
              style={{ aspectRatio: r.cssAspect }}
            />
            <div className="text-xs leading-tight text-center">
              <div className={cn("font-medium", active ? "text-text-primary" : "text-text-secondary")}>
                {r.ratio}
              </div>
              <div className="text-[10px] text-text-muted">{r.label.split(" ")[1] ?? ""}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
