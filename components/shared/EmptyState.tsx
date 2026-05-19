import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-xl border border-dashed border-border bg-bg-surface/40",
        "px-8 py-16",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-elevated border border-border text-accent">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
