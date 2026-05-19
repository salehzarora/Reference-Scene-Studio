"use client";

import { UserSquare2 } from "lucide-react";
import type { CharacterReference } from "@/types/scene";

interface Props {
  reference: CharacterReference;
}

export function CharacterReferencePreview({ reference }: Props) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated overflow-hidden">
      <div className="bg-bg-base flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reference.imageUrl}
          alt={reference.name || "Character reference"}
          className="w-full max-h-72 object-contain"
        />
      </div>
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
          <UserSquare2 className="h-3.5 w-3.5 text-accent" />
          Character reference
        </div>
        <div className="text-sm font-medium text-text-primary">
          {reference.name || (
            <span className="text-text-muted italic">Unnamed reference</span>
          )}
        </div>
        {reference.notes ? (
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {reference.notes}
          </p>
        ) : (
          <p className="text-xs text-text-muted italic">No notes provided.</p>
        )}
      </div>
    </div>
  );
}
