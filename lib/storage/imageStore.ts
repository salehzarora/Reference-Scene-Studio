import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Server-side image storage.
 *
 * Writes images into <projectRoot>/public/uploads/ so they're served by
 * Next.js as static files under /uploads/<filename>. Used for both
 * AI-generated images and uploaded character references — anything that
 * would otherwise bloat localStorage with multi-MB data URLs.
 *
 * NOTE: This is local development storage, not production storage.
 * For production we'd point this at S3, Cloudinary, Supabase Storage, etc.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB hard cap per image

export interface StoredImage {
  imageUrl: string; // public-facing path under /uploads/
  fileName: string;
  bytes: number;
  mime: string;
}

async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "image/png") return "png";
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/webp") return "webp";
  if (m === "image/svg+xml") return "svg";
  if (m === "image/gif") return "gif";
  if (m === "image/avif") return "avif";
  return "bin";
}

function slugify(input: string | undefined): string {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

interface DecodedDataUrl {
  mime: string;
  buffer: Buffer;
}

function parseDataUrl(dataUrl: string): DecodedDataUrl {
  // data:[<mediatype>][;base64],<data>
  const match = /^data:([^;,]+)?(?:;[^,]*)*,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error("Could not parse data URL");
  const mime = (match[1] || "application/octet-stream").trim();
  const payload = match[2] ?? "";
  const isBase64 = /;base64/.test(dataUrl.slice(0, 64));
  const buffer = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf-8");
  return { mime, buffer };
}

async function writeBuffer(
  buffer: Buffer,
  mime: string,
  fileName: string | undefined,
): Promise<StoredImage> {
  if (buffer.length > MAX_BYTES) {
    throw new Error(
      `Image is too large to store (${(buffer.length / 1024 / 1024).toFixed(1)} MB).`,
    );
  }
  await ensureUploadDir();
  const ext = extFromMime(mime);
  const slug = slugify(fileName);
  const unique = randomUUID();
  const finalName = slug
    ? `${slug}-${unique.slice(0, 8)}.${ext}`
    : `${unique}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, finalName);
  await fs.writeFile(filePath, buffer);
  return {
    imageUrl: `/uploads/${finalName}`,
    fileName: finalName,
    bytes: buffer.length,
    mime,
  };
}

/**
 * Decode a base64 (or plain) data URL and persist to /public/uploads.
 */
export async function storeImageFromDataUrl(
  dataUrl: string,
  fileName?: string,
): Promise<StoredImage> {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    throw new Error("Expected a data: URL");
  }
  const { mime, buffer } = parseDataUrl(dataUrl);
  return writeBuffer(buffer, mime, fileName);
}

/**
 * Fetch a remote image (e.g. an OpenAI URL that will eventually expire)
 * and persist it locally so the reference is stable.
 */
export async function storeImageFromUrl(
  url: string,
  fileName?: string,
): Promise<StoredImage> {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("Expected an http(s) URL");
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch image (HTTP ${res.status}) — could not persist`,
    );
  }
  const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return writeBuffer(buffer, mime, fileName);
}

/**
 * Universal dispatcher: accepts a data URL, an http(s) URL, or an existing
 * local /uploads/ path (passes through). Used by the generate-image route
 * to normalize whatever the provider returns into a stable local URL.
 */
export async function storeImageAny(
  source: string,
  fileName?: string,
): Promise<StoredImage> {
  if (source.startsWith("data:")) {
    return storeImageFromDataUrl(source, fileName);
  }
  if (/^https?:\/\//i.test(source)) {
    return storeImageFromUrl(source, fileName);
  }
  if (source.startsWith("/uploads/")) {
    // Already local. Return a synthetic StoredImage record so callers can
    // treat the response uniformly.
    return {
      imageUrl: source,
      fileName: source.replace(/^\/uploads\//, ""),
      bytes: 0,
      mime: "image/*",
    };
  }
  throw new Error("Unsupported image source");
}
