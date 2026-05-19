"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Settings, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p: string) => p === "/" },
  {
    href: "/scenes/new",
    label: "New Scene",
    icon: Plus,
    match: (p: string) => p.startsWith("/scenes/new"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: (p: string) => p.startsWith("/settings"),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-bg-surface/60 backdrop-blur">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="h-8 w-8 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
          <Clapperboard className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-text-primary">Reference Scene</div>
          <div className="text-[11px] text-text-muted -mt-0.5">Studio · v0.1</div>
        </div>
      </div>
      <nav className="flex-1 p-2.5 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-accent/12 text-text-primary border border-accent/25"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-accent" : "")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="rounded-md border border-border bg-bg-base/60 px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-wider text-text-muted">Stage</div>
          <div className="text-sm text-text-primary mt-0.5">1 · Text → Image</div>
        </div>
      </div>
    </aside>
  );
}
