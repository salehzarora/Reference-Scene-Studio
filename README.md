# Reference Scene Studio

AI production workflow web app — single scenes and multi-scene series, built incrementally toward a full agent-driven studio pipeline.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # optional
npm run dev
```

Open http://localhost:3000.

- Leave `OPENAI_API_KEY` empty in `.env.local` → **placeholder mode** (no real generation).
- Set `OPENAI_API_KEY=sk-...` and restart → **OpenAI mode** using `gpt-image-1`.
- Optional: `OPENAI_FALLBACK_DALLE3=true` falls back to `dall-e-3` only if `gpt-image-1` returns a model error.

Production build / preview:
```bash
npm run build
npm run start
```

## Image storage (development)

Generated images and uploaded character references are stored on the local filesystem during development:

- Server route: `POST /api/images/store` — accepts `{ imageDataUrl, fileName? }`, decodes the data URL, writes to `public/uploads/`, returns `{ imageUrl: "/uploads/<filename>" }`.
- The `/api/generate-image` route persists the provider's output through the same utility and returns a `/uploads/...` URL — never a multi-MB data URL.
- The `CharacterReferenceUploader` posts the compressed reference image to `/api/images/store` and saves only the returned URL.
- localStorage holds **metadata + image URLs only**. The previous "Local storage is full" failure mode is gone.

`public/uploads/` is gitignored. Files written here persist locally across sessions; delete the folder to start fresh.

### Not for production

This file-on-disk approach is for local development only. It does not scale and is not safe across deploys.

Production should swap `lib/storage/imageStore.ts` for an object-storage backend:

- AWS S3 (with signed PUT for direct browser uploads)
- Cloudinary
- Supabase Storage
- Vercel Blob

The contract — `storeImageFromDataUrl`, `storeImageFromUrl`, `storeImageAny` returning `{ imageUrl, fileName, bytes, mime }` — stays the same; only the implementation changes.

## Project structure

```
app/
  api/
    generate-image/route.ts   POST: provider → persist → return URL
    images/store/route.ts     POST: decode data URL → write to /uploads
    health/route.ts           GET:  provider status
  scenes/new/page.tsx         Single-scene creation
  scenes/[id]/page.tsx        Single-scene detail
  series/new/page.tsx         Series creation
  series/[id]/page.tsx        Series detail (per-scene + bulk generation)
  settings/page.tsx
components/
  layout/                     AppShell, Sidebar, Topbar
  ui/                         Button, Input, Textarea, Card, Badge, Skeleton, Toast
  shared/                     EmptyState, Spinner
  scenes/                     Scene cards, image, metadata, reference uploader/preview
  series/                     Series cards, per-scene cards, list editor
lib/
  ai/                         provider adapters (placeholder, openai) + prompt builder
  storage/
    imageStore.ts             server-only: write to public/uploads
    localScenes.ts            client: scene metadata in localStorage
    localSeries.ts            client: series metadata in localStorage
  config/                     env, style presets, aspect ratios
  validators/                 zod schemas
  utils/                      compressImage (client-side canvas)
types/
  scene.ts                    Scene, CharacterReference
  series.ts                   SeriesProject, SeriesScene
public/
  uploads/                    (gitignored) generated images + references
```

## Stages shipped

- **Stage 1** — Single text → image scenes (Dashboard, New Scene, Scene Detail, Settings, placeholder mode, OpenAI `gpt-image-1`).
- **Stage 2** — Optional character reference upload with client-side compression; reference instructions injected into the prompt.
- **Stage 3** — Multi-scene series with shared character, style, and aspect; per-scene and bulk generation; built-in continuity instruction.
- **Storage fix** — Generated images and references now persist to disk under `/public/uploads/`; localStorage holds metadata only.

## Not yet implemented

Agents, storyboard, video generation, database, authentication, deployment.
