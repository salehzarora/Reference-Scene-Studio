import type { Config } from "tailwindcss";

/**
 * Tokens are exposed as `rgb(var(--token) / <alpha-value>)` so Tailwind
 * opacity modifiers (bg-accent/15, border-danger/30, etc.) work correctly.
 */
function withAlpha(varName: string): string {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": withAlpha("--bg-base"),
        "bg-surface": withAlpha("--bg-surface"),
        "bg-elevated": withAlpha("--bg-elevated"),
        "bg-hover": withAlpha("--bg-hover"),
        border: withAlpha("--border"),
        "border-strong": withAlpha("--border-strong"),
        "text-primary": withAlpha("--text-primary"),
        "text-secondary": withAlpha("--text-secondary"),
        "text-muted": withAlpha("--text-muted"),
        accent: withAlpha("--accent"),
        "accent-hover": withAlpha("--accent-hover"),
        success: withAlpha("--success"),
        warning: withAlpha("--warning"),
        danger: withAlpha("--danger"),
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-in": "fade-in 200ms ease-out",
        "slide-in": "slide-in 240ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
