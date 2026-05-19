"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-md border bg-bg-surface px-3 py-2.5 text-sm text-text-primary",
          "placeholder:text-text-muted resize-y min-h-[140px] leading-relaxed",
          "focus-ring transition-colors",
          invalid
            ? "border-danger/60"
            : "border-border hover:border-border-strong",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
