export type StylePreset = {
  id: string;
  label: string;
  description: string;
  modifiers: string;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Filmic lighting, shallow depth of field, anamorphic feel",
    modifiers:
      "cinematic composition, dramatic lighting, shallow depth of field, anamorphic lens, color graded, film grain, 35mm",
  },
  {
    id: "photoreal",
    label: "Photoreal",
    description: "Realistic photography, natural light, fine detail",
    modifiers:
      "ultra realistic photography, natural lighting, fine detail, sharp focus, full-frame DSLR, 50mm",
  },
  {
    id: "anime",
    label: "Anime",
    description: "Stylized 2D anime art, clean lines, vivid color",
    modifiers:
      "anime style, cel shaded, clean line art, vivid color palette, expressive composition, studio-quality key visual",
  },
  {
    id: "concept-art",
    label: "Concept Art",
    description: "Production concept art, painterly, illustrative",
    modifiers:
      "professional concept art, painterly brushwork, illustrative, strong silhouette, production design quality",
  },
  {
    id: "noir",
    label: "Noir",
    description: "High contrast monochrome, hard shadows, moody",
    modifiers:
      "film noir aesthetic, high contrast black and white, hard shadows, smoke, moody atmosphere, low-key lighting",
  },
  {
    id: "pixar",
    label: "3D Animated",
    description: "Stylized 3D character animation look",
    modifiers:
      "stylized 3D animation, soft global illumination, rounded forms, expressive lighting, animated feature film look",
  },
];

export function getStylePreset(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((s) => s.id === id);
}

export const DEFAULT_STYLE_ID = "cinematic";
