import "server-only";
import type { ImageProvider, GenerateInput, GenerateResult } from "./types";

// Returns an inline SVG data URI sized to the requested aspect ratio.
// This avoids needing any binary asset files on disk.
function buildSvg(prompt: string, ratio: string): string {
  // Choose nominal dimensions per ratio.
  const dims: Record<string, [number, number]> = {
    "16:9": [1600, 900],
    "9:16": [900, 1600],
    "1:1": [1200, 1200],
    "4:3": [1600, 1200],
    "21:9": [2100, 900],
  };
  const [w, h] = dims[ratio] ?? [1600, 900];

  // Trim prompt for label.
  const label =
    prompt.length > 120 ? prompt.slice(0, 117).trimEnd() + "…" : prompt;
  const safeLabel = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12141A"/>
      <stop offset="50%" stop-color="#1A1D26"/>
      <stop offset="100%" stop-color="#0A0B0F"/>
    </linearGradient>
    <pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#242833" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#p)" opacity="0.5"/>
  <g font-family="-apple-system, Segoe UI, Inter, sans-serif" fill="#F5F6F8">
    <text x="${w / 2}" y="${h / 2 - 40}" text-anchor="middle" font-size="${Math.round(
      Math.min(w, h) / 16,
    )}" font-weight="700" letter-spacing="2" fill="#6366F1">PLACEHOLDER</text>
    <text x="${w / 2}" y="${h / 2 + 10}" text-anchor="middle" font-size="${Math.round(
      Math.min(w, h) / 28,
    )}" fill="#9AA0AE">${ratio} · No API key configured</text>
    <text x="${w / 2}" y="${h / 2 + 70}" text-anchor="middle" font-size="${Math.round(
      Math.min(w, h) / 40,
    )}" fill="#5C6172">${safeLabel}</text>
  </g>
</svg>`;

  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

export const placeholderProvider: ImageProvider = {
  name: "placeholder",
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const start = Date.now();
    // Tiny delay so the UI still shows a brief loading state.
    await new Promise((r) => setTimeout(r, 400));
    const imageUrl = buildSvg(input.prompt, input.aspectRatio.id);
    return {
      imageUrl,
      provider: "placeholder",
      model: "placeholder-svg",
      latencyMs: Date.now() - start,
    };
  },
};
