"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover disabled:bg-accent/40 disabled:text-white/70",
  secondary:
    "bg-bg-elevated text-text-primary border border-border hover:bg-bg-hover hover:border-border-strong disabled:opacity-50",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-50",
  danger:
    "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-ring select-none",
          "disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden
            className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin"
          />
        ) : null}
        <span className={cn(loading && "opacity-90")}>{children}</span>
      </button>
    );
  },
);
Button.displayName = "Button";
