"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Album, Compass, Heart, Images, LibraryBig, MapPinned, Menu, Search, Shield, Upload, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";
import { ProcessingIndicator } from "@/components/processing-indicator";

const navigation = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/albums", label: "Albums", icon: Album },
  { href: "/map", label: "Places", icon: MapPinned },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/admin", label: "Administration", icon: Shield, adminOnly: true }
];

export function SidebarNavigation({
  user,
  albums
}: {
  user: { name: string; email: string; role?: "ADMIN" | "USER" };
  albums: Array<{ id: string; title: string }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [albumQuery, setAlbumQuery] = useState("");

  const links = navigation.filter((item) => !item.adminOnly || user.role === "ADMIN");
  const visibleAlbums = albumQuery.trim()
    ? albums.filter((album) => album.title.toLocaleLowerCase().includes(albumQuery.trim().toLocaleLowerCase()))
    : albums;
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

        <nav className="mt-7 flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Primary navigation">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = active(item.href);
            return (
              <div key={item.href}>
                <Link
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
                {item.href === "/albums" && albums.length ? (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-[hsl(var(--border))] pl-3">
                    {albums.length > 4 ? (
                      <label className="relative mb-1 block">
                        <span className="sr-only">Search albums in navigation</span>
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--fg))]/40" />
                        <input value={albumQuery} onChange={(event) => setAlbumQuery(event.target.value)} placeholder="Find album" className="h-8 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] pl-8 pr-2 text-xs outline-none focus-visible:focus-ring" />
                      </label>
                    ) : null}
                    {visibleAlbums.map((album) => {
                      const albumActive = pathname === `/albums/${album.id}`;
                      return (
                        <Link
                          key={album.id}
                          href={`/albums/${album.id}`}
                          onClick={() => setOpen(false)}
                          aria-current={albumActive ? "page" : undefined}
                          className={cn(
                            "block truncate rounded-xl px-3 py-2 text-xs transition",
                            albumActive
                              ? "bg-[hsl(var(--accent))]/15 font-semibold text-[hsl(var(--accent))]"
                              : "text-[hsl(var(--fg))]/55 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--fg))]"
                          )}
                        >
                          {album.title}
                        </Link>
                      );
                    })}
                    {albumQuery && !visibleAlbums.length ? <div className="px-3 py-2 text-xs text-[hsl(var(--fg))]/45">No matching albums</div> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-[hsl(var(--border))] pt-4">
          <ProcessingIndicator />
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
