import { NextResponse } from "next/server";
import { z } from "zod";
import { storeImageFromDataUrl } from "@/lib/storage/imageStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  imageDataUrl: z
    .string()
    .min(16, "imageDataUrl is required")
    .max(20_000_000, "Image payload is too large"),
  fileName: z.string().max(120).optional(),
});

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return errorResponse("invalid_json", "Request body must be JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return errorResponse(
      "validation_error",
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      400,
    );
  }

  try {
    const stored = await storeImageFromDataUrl(
      parsed.data.imageDataUrl,
      parsed.data.fileName,
    );
    return NextResponse.json({
      imageUrl: stored.imageUrl,
      fileName: stored.fileName,
      bytes: stored.bytes,
      mime: stored.mime,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to store image";
    return errorResponse("store_failed", message, 500);
  }
}
