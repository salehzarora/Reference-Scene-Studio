export type AspectRatio = {
  id: string;
  label: string;
  ratio: string; // e.g. "16:9"
  // Size used when requesting from OpenAI Images.
  // gpt-image-1 supports: 1024x1024, 1024x1536, 1536x1024, "auto"
  openaiSize: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  // CSS aspect-ratio token for preview boxes.
  cssAspect: string;
};

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    id: "16:9",
    label: "16:9 Widescreen",
    ratio: "16:9",
    openaiSize: "1536x1024",
    cssAspect: "16 / 9",
  },
  {
    id: "9:16",
    label: "9:16 Vertical",
    ratio: "9:16",
    openaiSize: "1024x1536",
    cssAspect: "9 / 16",
  },
  {
    id: "1:1",
    label: "1:1 Square",
    ratio: "1:1",
    openaiSize: "1024x1024",
    cssAspect: "1 / 1",
  },
  {
    id: "4:3",
    label: "4:3 Classic",
    ratio: "4:3",
    openaiSize: "1536x1024",
    cssAspect: "4 / 3",
  },
  {
    id: "21:9",
    label: "21:9 Cinematic",
    ratio: "21:9",
    openaiSize: "1536x1024",
    cssAspect: "21 / 9",
  },
];

export function getAspectRatio(id: string): AspectRatio | undefined {
  return ASPECT_RATIOS.find((a) => a.id === id);
}

export const DEFAULT_ASPECT_ID = "16:9";
