"use client";

import type { SeriesProject, SeriesScene } from "@/types/series";

const STORAGE_KEY = "rss:series:v1";
export const MAX_SERIES = 20;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readAll(): SeriesProject[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SeriesProject[];
  } catch (err) {
    console.warn("localSeries: failed to read storage", err);
    return [];
  }
}

export class SeriesQuotaError extends Error {
  constructor() {
    super(
      "Local storage is full. Delete some scenes or series and try again.",
    );
    this.name = "SeriesQuotaError";
  }
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err.code === 22)
  );
}

function writeAll(series: SeriesProject[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(series));
  } catch (err) {
    if (isQuotaError(err)) {
      throw new SeriesQuotaError();
    }
    console.warn("localSeries: failed to write storage", err);
    throw err;
  }
}

export function listSeries(): SeriesProject[] {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getSeries(id: string): SeriesProject | undefined {
  return readAll().find((s) => s.id === id);
}

export function saveSeries(series: SeriesProject): void {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === series.id);
  if (idx >= 0) {
    all[idx] = series;
  } else {
    all.unshift(series);
    if (all.length > MAX_SERIES) {
      all.length = MAX_SERIES;
    }
  }
  writeAll(all);
}

export function deleteSeries(id: string): void {
  const all = readAll().filter((s) => s.id !== id);
  writeAll(all);
}

export function updateSeriesScene(
  seriesId: string,
  sceneId: string,
  patch: Partial<SeriesScene>,
): SeriesProject | undefined {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === seriesId);
  if (idx < 0) return undefined;
  const series = all[idx];
  if (!series) return undefined;
  const sceneIdx = series.scenes.findIndex((sc) => sc.id === sceneId);
  if (sceneIdx < 0) return series;
  const target = series.scenes[sceneIdx];
  if (!target) return series;
  const nextScene: SeriesScene = {
    ...target,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const nextScenes = [...series.scenes];
  nextScenes[sceneIdx] = nextScene;
  const next: SeriesProject = {
    ...series,
    scenes: nextScenes,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = next;
  writeAll(all);
  return next;
}

export function clearAllSeries(): void {
  writeAll([]);
}

export function countSeries(): number {
  return readAll().length;
}
