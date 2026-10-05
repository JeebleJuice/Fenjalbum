"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Album, Heart, Images, Menu, Shield, Upload, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Gallery", icon: Images },
  { href: "/albums", label: "Albums", icon: Album },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/admin", label: "Administration", icon: Shield, adminOnly: true }
];

export function SidebarNavigation({ user }: { user: { name: string; email: string; role?: "ADMIN" | "USER" } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = navigation.filter((item) => !item.adminOnly || user.role === "ADMIN");
  const active = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/90 px-4 backdrop-blur-xl lg:hidden">
        <Brand />
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open ? <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} /> : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-200 lg:z-30 lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-2 py-2">
          <Brand onNavigate={() => setOpen(false)} />
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[hsl(var(--muted))] lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-7 flex-1 space-y-1" aria-label="Primary navigation">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[hsl(var(--fg))] text-[hsl(var(--bg))] shadow-lg shadow-black/10"
                    : "text-[hsl(var(--fg))]/70 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--fg))]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-[hsl(var(--border))] pt-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--fg))]/45">Appearance</span>
            <ThemeToggle />
          </div>
          <UserMenu user={user} compact />
        </div>
      </aside>
    </>
  );
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex min-w-0 items-center gap-3" aria-label="Fenjalbum gallery">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--fg)))] text-[hsl(var(--accent-fg))] shadow-lg shadow-black/10">
        <Images className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold tracking-tight">Fenjalbum</span>
        <span className="block truncate text-xs text-[hsl(var(--fg))]/50">Your private library</span>
      </span>
    </Link>
  );
}
