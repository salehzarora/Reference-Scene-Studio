"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  ImageIcon,
  Sparkles,
  Database,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SceneGrid } from "@/components/scenes/SceneGrid";
import { SeriesCard } from "@/components/series/SeriesCard";
import { listScenes, MAX_SCENES } from "@/lib/storage/localScenes";
import { listSeries } from "@/lib/storage/localSeries";
import type { Scene } from "@/types/scene";
import type { SeriesProject } from "@/types/series";

export default function DashboardPage() {
  const [mounted, setMounted] = React.useState(false);
  const [scenes, setScenes] = React.useState<Scene[]>([]);
  const [series, setSeries] = React.useState<SeriesProject[]>([]);

  React.useEffect(() => {
    setScenes(listScenes());
    setSeries(listSeries());
    setMounted(true);
  }, []);

  const sceneCount = scenes.length;
  const seriesCount = series.length;
  const totalImagesReady =
    scenes.filter((s) => s.status === "ready").length +
    series.reduce(
      (acc, s) => acc + s.scenes.filter((sc) => sc.status === "ready").length,
      0,
    );
  const nearCap = sceneCount >= MAX_SCENES - 5;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Stage 3 · Scenes &amp; Series
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">
            Create single scenes from a description, or build a multi-scene
            series that shares one character, style, and aspect ratio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/series/new">
            <Button size="lg" variant="secondary">
              <Film className="h-4 w-4" />
              New Series
            </Button>
          </Link>
          <Link href="/scenes/new">
            <Button size="lg">
              <Plus className="h-4 w-4" />
              New Scene
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<ImageIcon className="h-4 w-4" />}
          label="Single scenes"
          value={mounted ? String(sceneCount) : "—"}
          hint={`Local cap ${MAX_SCENES}`}
        />
        <StatCard
          icon={<Film className="h-4 w-4" />}
          label="Series"
          value={mounted ? String(seriesCount) : "—"}
          hint="Multi-scene projects"
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Images ready"
          value={mounted ? String(totalImagesReady) : "—"}
          hint="Across scenes + series"
        />
        <StatCard
          icon={<Database className="h-4 w-4" />}
          label="Storage"
          value="localStorage"
          hint="Stage 3 · no database"
        />
      </div>

      {nearCap && mounted ? (
        <Card className="px-4 py-3 border-warning/30 bg-warning/10">
          <p className="text-sm text-warning">
            You&rsquo;re near the {MAX_SCENES}-single-scene local cap. Oldest
            scenes will be dropped when you cross it.
          </p>
        </Card>
      ) : null}

      {/* Series section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
            Scene Series
          </h2>
          {mounted && series.length > 0 ? (
            <span className="text-xs text-text-muted">
              {series.length} total
            </span>
          ) : null}
        </div>

        {!mounted ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : series.length === 0 ? (
          <EmptyState
            icon={<Film className="h-6 w-6" />}
            title="No series yet"
            description="Group multiple scenes into a series so they share one character reference, style, and aspect ratio with built-in continuity."
            action={
              <Link href="/series/new">
                <Button>
                  <Film className="h-4 w-4" />
                  Create your first series
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {series.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        )}
      </section>

      {/* Single scenes section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
            Recent single scenes
          </h2>
          {mounted && scenes.length > 0 ? (
            <span className="text-xs text-text-muted">
              {scenes.length} total
            </span>
          ) : null}
        </div>

        {!mounted ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : scenes.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-6 w-6" />}
            title="No single scenes yet"
            description="Quick one-off images. Describe the scene, pick a style and aspect ratio, generate."
            action={
              <Link href="/scenes/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Create your first scene
                </Button>
              </Link>
            }
          />
        ) : (
          <SceneGrid scenes={scenes} />
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="text-accent">{icon}</span>
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 text-xl font-semibold text-text-primary">
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[11px] text-text-muted">{hint}</div>
      ) : null}
    </Card>
  );
}
