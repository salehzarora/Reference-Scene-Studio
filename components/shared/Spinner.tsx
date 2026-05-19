import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-5 w-5 rounded-full border-2 border-text-muted border-r-transparent animate-spin",
        className,
      )}
    />
  );
}
