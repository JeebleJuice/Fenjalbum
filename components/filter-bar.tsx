"use client";

import { Badge, Button, Input, Select } from "@/components/ui";

export type GalleryQuery = {
  q?: string;
  mediaType?: string;
  albumId?: string;
  sort?: string;
  favorite?: string;
  page?: string;
  view?: string;
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
    <form method="get" className="space-y-3 rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-soft">
      <input type="hidden" name="view" value={query.view ?? "large"} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Input name="q" defaultValue={query.q ?? ""} placeholder="Search by filename, title, description, tag, album, or date" className="xl:col-span-2" />
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
        <Button type="submit">{actionLabel}</Button>
        <Button type="reset" variant="secondary" onClick={() => (window.location.href = window.location.pathname)}>
          Clear filters
        </Button>
        {query.q || query.mediaType || query.albumId || query.sort || query.favorite ? (
          <Badge className="bg-[hsl(var(--muted))]">Active filters</Badge>
        ) : (
          <Badge>Default view</Badge>
        )}
      </div>
    </form>
  );
}
