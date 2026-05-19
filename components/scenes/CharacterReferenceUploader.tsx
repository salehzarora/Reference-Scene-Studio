"use client";

import * as React from "react";
import { Upload, X, ImagePlus, Loader2, UserSquare2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { compressImage, formatKb } from "@/lib/utils/compressImage";
import { cn } from "@/lib/utils";
import type { CharacterReference } from "@/types/scene";

interface Props {
  value: CharacterReference | null;
  onChange: (next: CharacterReference | null) => void;
}

export function CharacterReferenceUploader({ value, onChange }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<{
    bytes: number;
    width: number;
    height: number;
  } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const result = await compressImage(file);
      onChange({
        name: value?.name ?? "",
        notes: value?.notes ?? "",
        imageUrl: result.dataUrl,
      });
      setMeta({
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process image.");
    } finally {
      setBusy(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function updateField(field: "name" | "notes", v: string) {
    if (!value) return;
    onChange({ ...value, [field]: v });
  }

  function remove() {
    onChange(null);
    setError(null);
    setMeta(null);
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!value?.imageUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-lg"
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              "w-full rounded-lg border border-dashed border-border",
              "hover:border-accent/40 hover:bg-bg-elevated/60 transition-colors",
              "px-6 py-10 flex flex-col items-center justify-center text-center gap-2 focus-ring",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            ) : (
              <ImagePlus className="h-6 w-6 text-accent" />
            )}
            <div className="text-sm font-medium text-text-primary">
              {busy ? "Processing image…" : "Upload character reference"}
            </div>
            <div className="text-xs text-text-muted">
              Click to browse or drop a PNG / JPEG / WebP — auto-resized for
              local storage
            </div>
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-bg-elevated overflow-hidden">
          <div className="relative bg-bg-base">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.imageUrl}
              alt={value.name || "Character reference"}
              className="w-full max-h-80 object-contain"
            />
            <button
              type="button"
              onClick={remove}
              className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-bg-base/80 border border-border px-2 py-1 text-xs text-text-secondary hover:text-danger hover:border-danger/40 transition-colors backdrop-blur"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-text-muted">
                Reference name
              </label>
              <Input
                className="mt-2"
                placeholder="e.g. Aria"
                value={value.name}
                onChange={(e) => updateField("name", e.target.value)}
                maxLength={80}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-text-muted">
                Notes / usage instructions
              </label>
              <Textarea
                className="mt-2 min-h-[88px]"
                placeholder="e.g. Keep the red leather jacket. Hair always tied back. Always center frame."
                value={value.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                maxLength={500}
              />
              <div className="mt-1 flex justify-between text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <UserSquare2 className="h-3 w-3" />
                  {meta
                    ? `${meta.width}×${meta.height} · ${formatKb(meta.bytes)}`
                    : "Stored locally only"}
                </span>
                <span>{value.notes.length}/500</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => inputRef.current?.click()}
                loading={busy}
              >
                <Upload className="h-3.5 w-3.5" />
                Replace image
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={remove}
              >
                <X className="h-3.5 w-3.5" />
                Remove reference
              </Button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error}
        </div>
      ) : null}
    </div>
  );
}
