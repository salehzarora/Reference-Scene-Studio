"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

function crumbs(pathname: string): { label: string; href: string }[] {
  if (pathname === "/") return [{ label: "Dashboard", href: "/" }];
  if (pathname.startsWith("/scenes/new")) {
    return [
      { label: "Dashboard", href: "/" },
      { label: "New Scene", href: "/scenes/new" },
    ];
  }
  if (pathname.startsWith("/scenes/")) {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Scene", href: pathname },
    ];
  }
  if (pathname.startsWith("/series/new")) {
    return [
      { label: "Dashboard", href: "/" },
      { label: "New Series", href: "/series/new" },
    ];
  }
  if (pathname.startsWith("/series/")) {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Series", href: pathname },
    ];
  }
  if (pathname.startsWith("/settings")) {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Settings", href: "/settings" },
    ];
  }
  return [{ label: "Dashboard", href: "/" }];
}

export function Topbar() {
  const pathname = usePathname();
  const items = crumbs(pathname);
  return (
    <header className="h-14 shrink-0 border-b border-border bg-bg-base/70 backdrop-blur sticky top-0 z-30">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-text-secondary">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <span key={c.href} className="flex items-center gap-1.5">
                {i > 0 ? (
                  <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                ) : null}
                {last ? (
                  <span className="text-text-primary font-medium">
                    {c.label}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    className="hover:text-text-primary transition-colors"
                  >
                    {c.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Local mode
        </div>
      </div>
    </header>
  );
}
