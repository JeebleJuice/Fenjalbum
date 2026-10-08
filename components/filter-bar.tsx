"use client";

import Link from "next/link";
import { CalendarRange, ChevronDown, Film, Image as ImageIcon, Search, SlidersHorizontal } from "lucide-react";
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
  const selectedType = query.mediaType === "photo" || query.mediaType === "video" ? query.mediaType : "all";
  const advancedOpen = Boolean(query.albumId || query.favorite || query.dateFrom || query.dateTo || (query.sort && query.sort !== "newest"));
  const hasFilters = Boolean(query.q || selectedType !== "all" || advancedOpen);
  const typeHref = (mediaType: string) => {
    const next = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    if (mediaType === "all") next.delete("mediaType");
    else next.set("mediaType", mediaType);
    next.delete("page");
    const nextQuery = next.toString();
    return `/library${nextQuery ? `?${nextQuery}` : ""}`;
  };

  return (
    <form method="get" className="space-y-3 rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 p-3 shadow-soft sm:p-4">
      <input type="hidden" name="view" value={query.view ?? "large"} />
      {selectedType !== "all" ? <input type="hidden" name="mediaType" value={selectedType} /> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search your media library</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--fg))]/45" />
          <Input
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Search media"
            className="h-11 rounded-full border-transparent bg-[hsl(var(--muted))] pl-12 pr-5 shadow-none focus:border-[hsl(var(--accent))]"
          />
        </label>
        <Button type="submit" className="shrink-0 px-5">{actionLabel}</Button>
      </div>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5" aria-label="Media type">
        {[
          { value: "all", label: "All media", icon: SlidersHorizontal },
          { value: "photo", label: "Photos", icon: ImageIcon },
          { value: "video", label: "Videos", icon: Film }
        ].map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            asChild
            variant={selectedType === value ? "primary" : "secondary"}
            className="h-9 shrink-0 rounded-full px-3 text-xs"
          >
            <Link href={typeHref(value)}><Icon className="h-3.5 w-3.5" /> {label}</Link>
          </Button>
        ))}
      </div>
      <details open={advancedOpen} className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/45">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> More filters</span>
          <span className="flex items-center gap-2 text-xs text-[hsl(var(--fg))]/50">{advancedOpen ? "Applied" : "Dates, albums, sorting"}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></span>
        </summary>
        <div className="space-y-3 border-t border-[hsl(var(--border))] p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-medium text-[hsl(var(--fg))]/55">
              <span className="flex items-center gap-2"><CalendarRange className="h-4 w-4" /> Captured from</span>
              <Input type="text" inputMode="numeric" name="dateFrom" defaultValue={query.dateFrom ?? ""} placeholder="dd/mm/yyyy or yyyy" aria-label="Captured from, day month year" />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-[hsl(var(--fg))]/55">
              <span className="flex items-center gap-2"><CalendarRange className="h-4 w-4" /> Captured through</span>
              <Input type="text" inputMode="numeric" name="dateTo" defaultValue={query.dateTo ?? ""} placeholder="dd/mm/yyyy or yyyy" aria-label="Captured through, day month year" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select name="albumId" defaultValue={query.albumId ?? ""}>
              <option value="">All albums</option>
              <option value="unsorted">Unsorted</option>
              {albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}
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
        </div>
      </details>
      <div className="flex items-center gap-2">
        {hasFilters ? <Badge className="bg-[hsl(var(--muted))]">Active filters</Badge> : <Badge>Default view</Badge>}
        {hasFilters ? <Button type="reset" variant="secondary" className="ml-auto h-8 px-3 text-xs" onClick={() => (window.location.href = window.location.pathname)}>Clear</Button> : null}
      </div>
    </form>
  );
}
