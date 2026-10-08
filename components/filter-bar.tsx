"use client";

import { CalendarRange, Search, SlidersHorizontal } from "lucide-react";
import { Badge, Button, Input, Select } from "@/components/ui";

export type GalleryQuery = {
  q?: string;
  mediaType?: string;
  albumId?: string;
  sort?: string;
  favorite?: string;
  page?: string;
  view?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function FilterBar({
  albums,
  query,
  actionLabel = "Apply"
}: {
  albums: Array<{ id: string; title: string }>;
  query: GalleryQuery;
  actionLabel?: string;
}) {
  return (
    <form method="get" className="space-y-4 rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 p-4 shadow-soft sm:p-5">
      <input type="hidden" name="view" value={query.view ?? "large"} />
      <label className="relative block">
        <span className="sr-only">Search your media library</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--fg))]/45" />
        <Input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search names, tags, albums, or 21/03/2026 - 25/4/2026"
          className="h-[3.25rem] rounded-full border-transparent bg-[hsl(var(--muted))] pl-12 pr-5 text-base shadow-none focus:border-[hsl(var(--accent))]"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium text-[hsl(var(--fg))]/55">
          <span className="flex items-center gap-2"><CalendarRange className="h-4 w-4" /> Captured from</span>
          <Input type="date" name="dateFrom" defaultValue={query.dateFrom ?? ""} />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-[hsl(var(--fg))]/55">
          <span className="flex items-center gap-2"><CalendarRange className="h-4 w-4" /> Captured through</span>
          <Input type="date" name="dateTo" defaultValue={query.dateTo ?? ""} />
        </label>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[hsl(var(--fg))]/45">
        <SlidersHorizontal className="h-4 w-4" />
        Refine results
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select name="mediaType" defaultValue={query.mediaType ?? "all"}>
          <option value="all">All media</option>
          <option value="photo">Photos only</option>
          <option value="video">Videos only</option>
        </Select>
        <Select name="albumId" defaultValue={query.albumId ?? ""}>
          <option value="">All albums</option>
          <option value="unsorted">Unsorted</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </Select>
        <Select name="sort" defaultValue={query.sort ?? "newest"}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="alpha">Alphabetical</option>
          <option value="upload">Upload date</option>
        </Select>
        <Select name="favorite" defaultValue={query.favorite ?? ""}>
          <option value="">All items</option>
          <option value="true">Favorites</option>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className="min-w-28">{actionLabel}</Button>
        <Button type="reset" variant="secondary" onClick={() => (window.location.href = window.location.pathname)}>
          Clear filters
        </Button>
        {query.q || query.mediaType || query.albumId || query.sort || query.favorite || query.dateFrom || query.dateTo ? (
          <Badge className="bg-[hsl(var(--muted))]">Active filters</Badge>
        ) : (
          <Badge>Default view</Badge>
        )}
      </div>
    </form>
  );
}
