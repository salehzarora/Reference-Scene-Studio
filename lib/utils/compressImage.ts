"use client";

/**
 * Client-side image compression. Downscales to fit within `maxDim`, then
 * encodes as JPEG, iteratively lowering quality until the result fits in
 * `maxBytes`. Transparent PNGs are flattened on a dark background.
 *
 * Returns a data URL safe to persist in localStorage.
 */

export interface CompressOptions {
  maxDim?: number;
  initialQuality?: number;
  minQuality?: number;
  maxBytes?: number;
}

export interface CompressResult {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
  originalBytes: number;
  finalQuality: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxDim: 768,
  initialQuality: 0.85,
  minQuality: 0.55,
  maxBytes: 220_000, // ~220 KB after base64 expansion still ≈ 300 KB string
};

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const opts = { ...DEFAULTS, ...options };

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file (PNG, JPEG, or WebP).");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Image file is too large (max 25 MB before compression).");
  }

  const fileDataUrl = await readAsDataURL(file);
  const img = await loadImage(fileDataUrl);

  const { width, height } = scaleToFit(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    opts.maxDim,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Your browser does not support canvas image compression.");
  }
  // Flatten transparency onto the app's dark base so PNGs render predictably.
  ctx.fillStyle = "#0a0b0f";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = opts.initialQuality;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  let bytes = approxBytes(dataUrl);

  // Iteratively reduce quality if we're over the cap.
  while (bytes > opts.maxBytes && quality > opts.minQuality + 0.001) {
    quality = Math.max(opts.minQuality, quality - 0.1);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    bytes = approxBytes(dataUrl);
  }

  if (bytes > opts.maxBytes) {
    throw new Error(
      `This image is too detailed to store locally (final size ${formatKb(
        bytes,
      )}). Try a smaller, simpler, or lower-resolution image.`,
    );
  }

  return {
    dataUrl,
    bytes,
    width,
    height,
    originalBytes: file.size,
    finalQuality: Number(quality.toFixed(2)),
  };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the selected file."));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode this image."));
    img.src = src;
  });
}

function scaleToFit(w: number, h: number, maxDim: number) {
  if (!w || !h) return { width: maxDim, height: maxDim };
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  const ratio = w >= h ? maxDim / w : maxDim / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function approxBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4);
}

export function formatKb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}
