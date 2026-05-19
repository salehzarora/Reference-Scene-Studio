import { z } from "zod";
import { STYLE_PRESETS } from "@/lib/config/styles";
import { ASPECT_RATIOS } from "@/lib/config/aspectRatios";

const styleIds = STYLE_PRESETS.map((s) => s.id) as [string, ...string[]];
const aspectIds = ASPECT_RATIOS.map((a) => a.id) as [string, ...string[]];

export const generateImageSchema = z.object({
  description: z
    .string()
    .min(4, "Description must be at least 4 characters")
    .max(2000, "Description is too long (max 2000 chars)"),
  stylePreset: z.enum(styleIds),
  aspectRatio: z.enum(aspectIds),
});

export type GenerateImageBody = z.infer<typeof generateImageSchema>;
