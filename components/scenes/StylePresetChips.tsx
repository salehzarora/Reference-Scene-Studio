"use client";

import { STYLE_PRESETS } from "@/lib/config/styles";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export function StylePresetChips({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_PRESETS.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            title={s.description}
            className={cn(
              "px-3 h-9 rounded-md text-sm border transition-colors focus-ring",
              active
                ? "bg-accent/15 border-accent/40 text-text-primary"
                : "bg-bg-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-strong",
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
