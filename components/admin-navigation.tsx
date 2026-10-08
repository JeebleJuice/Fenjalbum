"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Album, Images, LayoutDashboard, Settings, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/albums", label: "Albums", icon: Album },
  { href: "/admin/trash", label: "Trash", icon: Trash2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Administration"
      className="sticky top-[4.75rem] z-20 -mx-1 flex gap-2 overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/90 p-2 shadow-soft backdrop-blur-xl lg:top-4"
    >
      {adminLinks.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-fg))] shadow-sm"
                : "text-[hsl(var(--fg))]/65 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--fg))]"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
