import { getStylePreset } from "@/lib/config/styles";
import { getAspectRatio } from "@/lib/config/aspectRatios";

export interface BuildPromptArgs {
  description: string;
  stylePreset: string;
  aspectRatio: string;
}

/**
 * Combine the user description with style modifiers and a ratio hint into
 * a single prompt string sent to the image provider.
 */
export function buildPrompt(args: BuildPromptArgs): string {
  const style = getStylePreset(args.stylePreset);
  const ratio = getAspectRatio(args.aspectRatio);
  const parts = [args.description.trim()];

  if (style) parts.push(style.modifiers);
  if (ratio) parts.push(`Aspect ratio ${ratio.ratio}`);

  return parts.filter(Boolean).join(". ");
}
