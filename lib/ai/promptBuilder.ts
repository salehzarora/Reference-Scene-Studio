import { getStylePreset } from "@/lib/config/styles";
import { getAspectRatio } from "@/lib/config/aspectRatios";
import type { CharacterReferenceForApi } from "@/types/scene";

export interface BuildPromptArgs {
  description: string;
  stylePreset: string;
  aspectRatio: string;
  characterReference?: CharacterReferenceForApi | null;
  seriesContinuity?: boolean;
}

export const SERIES_CONTINUITY_INSTRUCTION =
  "Keep the same character identity, proportions, clay texture, colors, and visual style across all scenes in this series.";

/**
 * Combine the user description, character reference instructions (if any),
 * style modifiers, aspect ratio hint, and continuity instruction (when this
 * scene is part of a series) into the final prompt string.
 */
export function buildPrompt(args: BuildPromptArgs): string {
  const style = getStylePreset(args.stylePreset);
  const ratio = getAspectRatio(args.aspectRatio);
  const parts: string[] = [args.description.trim()];

  if (args.characterReference) {
    const name = args.characterReference.name?.trim();
    const notes = args.characterReference.notes?.trim();
    const subject = name
      ? `the uploaded character reference "${name}"`
      : "the uploaded character reference";
    parts.push(
      `Use ${subject} as the main subject. Keep the same identity, face, body shape, colors, and style.`,
    );
    if (notes) {
      parts.push(`Reference notes: ${notes}`);
    }
  }

  if (args.seriesContinuity) {
    parts.push(SERIES_CONTINUITY_INSTRUCTION);
  }

  if (style) parts.push(style.modifiers);
  if (ratio) parts.push(`Aspect ratio ${ratio.ratio}`);

  return parts.filter(Boolean).join(". ");
}
