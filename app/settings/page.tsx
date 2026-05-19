"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, KeyRound, Server, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { listScenes, clearAllScenes } from "@/lib/storage/localScenes";
import { useToast } from "@/components/ui/Toast";

interface HealthResponse {
  ok: boolean;
  providerConfigured: boolean;
  provider: "openai" | "placeholder";
  primaryModel: string;
  fallbackEnabled: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sceneCount, setSceneCount] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    fetch("/api/health")
      .then((r) => {
        if (!r.ok) throw new Error(`Health check failed (HTTP ${r.status})`);
        return r.json() as Promise<HealthResponse>;
      })
      .then((data) => {
        if (!active) return;
        setHealth(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    setSceneCount(listScenes().length);
    return () => {
      active = false;
    };
  }, []);

  function handleClear() {
    if (!confirm(`Delete all ${sceneCount} local scenes? This can't be undone.`))
      return;
    clearAllScenes();
    setSceneCount(0);
    toast("All local scenes cleared", { variant: "info" });
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-wider text-text-muted">
          Configuration
        </div>
        <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">
          Read-only status of the active image generation provider and local
          storage. API keys are never shown.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Image generation provider</CardTitle>
              <CardDescription>
                Controlled by environment variables in <code>.env.local</code>.
              </CardDescription>
            </div>
            <Server className="h-5 w-5 text-text-muted" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-danger text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : health ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-4 w-4 text-text-muted" />
                  <div>
                    <div className="text-sm text-text-primary">OPENAI_API_KEY</div>
                    <div className="text-[11px] text-text-muted">
                      Server-side only · never sent to the browser
                    </div>
                  </div>
                </div>
                {health.providerConfigured ? (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <AlertCircle className="h-3 w-3" />
                    Not set · placeholder mode
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <Cell label="Active provider" value={health.provider} />
                <Cell label="Primary model" value={health.primaryModel} />
                <Cell
                  label="DALL·E 3 fallback"
                  value={health.fallbackEnabled ? "Enabled" : "Disabled"}
                />
              </div>

              {!health.providerConfigured ? (
                <div className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning leading-relaxed">
                  Placeholder mode is active. To enable real generation with
                  <code className="mx-1 font-mono">gpt-image-1</code>, add
                  <code className="mx-1 font-mono">OPENAI_API_KEY</code> to
                  <code className="mx-1 font-mono">.env.local</code> and
                  restart the dev server.
                </div>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Local storage</CardTitle>
              <CardDescription>
                Stage 1 stores scenes in your browser only. No database, no auth.
              </CardDescription>
            </div>
            <Layers className="h-5 w-5 text-text-muted" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-text-primary">
                {sceneCount} scene{sceneCount === 1 ? "" : "s"} stored locally
              </div>
              <div className="text-[11px] text-text-muted">
                Key: <code className="font-mono">rss:scenes:v1</code>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClear}
              disabled={sceneCount === 0}
            >
              Clear all scenes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About this stage</CardTitle>
          <CardDescription>
            Reference Scene Studio · Stage 1 · Text → Image (local-first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary leading-relaxed">
            This stage intentionally has no agents, no reference uploads, no
            multi-scene projects, no video generation, no database, no auth, and
            no deployment. Those land in later stages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-elevated px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-text-primary font-mono">{value}</div>
    </div>
  );
}
