"use client";

import type { Scene } from "@/types/scene";

const STORAGE_KEY = "rss:scenes:v1";
export const MAX_SCENES = 50;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readAll(): Scene[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Scene[];
  } catch (err) {
    console.warn("localScenes: failed to read storage", err);
    return [];
  }
}

function writeAll(scenes: Scene[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  } catch (err) {
    console.warn("localScenes: failed to write storage", err);
  }
}

export function listScenes(): Scene[] {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getScene(id: string): Scene | undefined {
  return readAll().find((s) => s.id === id);
}

export function saveScene(scene: Scene): void {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === scene.id);
  if (idx >= 0) {
    all[idx] = scene;
  } else {
    all.unshift(scene);
    if (all.length > MAX_SCENES) {
      all.length = MAX_SCENES;
    }
  }
  writeAll(all);
}

export function deleteScene(id: string): void {
  const all = readAll().filter((s) => s.id !== id);
  writeAll(all);
}

export function clearAllScenes(): void {
  writeAll([]);
}

export function countScenes(): number {
  return readAll().length;
}
