export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getGalleryData } from "@/lib/gallery-data";
import { FilterBar } from "@/components/filter-bar";
import { MediaGrid } from "@/components/gallery";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { ProcessingRefresh } from "@/components/processing-refresh";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const baseParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => typeof value === "string" && value !== "" && value !== "1")
  ) as Record<string, string>;
  const view = params.view === "compact" ? "compact" : params.view === "comfortable" ? "comfortable" : "large";
  const pageSize = view === "compact" ? 24 : view === "comfortable" ? 12 : 6;
  const data = await getGalleryData({
    q: typeof params.q === "string" ? params.q : undefined,
    mediaType: typeof params.mediaType === "string" ? (params.mediaType as "all" | "photo" | "video") : "all",
    albumId: typeof params.albumId === "string" ? params.albumId : undefined,
    favorite: params.favorite === "true",
    sort: typeof params.sort === "string" ? (params.sort as "newest" | "oldest" | "alpha" | "upload") : "newest",
    page: typeof params.page === "string" ? Number(params.page) : 1,
    pageSize
  });
  const items = data.items.map((media) => ({
    id: media.id,
    title: media.title,
    originalFilename: media.originalFilename,
    mediaType: media.mediaType,
    thumbSrc:
      media.mediaType === "PHOTO"
        ? media.thumbPath && media.processingStatus === "READY"
          ? `/api/media/${media.id}?variant=thumb`
          : `/api/media/${media.id}`
        : media.processingStatus === "READY" && media.thumbPath
          ? `/api/media/${media.id}?variant=thumb`
          : null,
    posterSrc: media.posterPath ? `/api/media/${media.id}?variant=poster` : null,
    width: media.width,
    height: media.height,
    duration: media.duration,
    uploadedAt: media.uploadedAt.toISOString(),
    captureAt: media.captureAt?.toISOString() ?? null,
    favorite: media.favorite,
    albumTitle: media.album?.title ?? null,
    processingStatus: media.processingStatus
  }));

  return (
    <AppShell user={user}>
      <ProcessingRefresh enabled={data.items.some((media) => media.processingStatus !== "READY")} />
      <FilterBar albums={data.albums.map((album) => ({ id: album.id, title: album.title }))} query={params} />
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--fg))]/45">View</span>
        <Button asChild variant={view === "compact" ? "primary" : "secondary"} className="px-3 py-1.5 text-xs">
          <Link href={`/?${new URLSearchParams({ ...baseParams, view: "compact" })}`}>Compact</Link>
        </Button>
        <Button asChild variant={view === "comfortable" ? "primary" : "secondary"} className="px-3 py-1.5 text-xs">
          <Link href={`/?${new URLSearchParams({ ...baseParams, view: "comfortable" })}`}>Comfortable</Link>
        </Button>
        <Button asChild variant={view === "large" ? "primary" : "secondary"} className="px-3 py-1.5 text-xs">
          <Link href={`/?${new URLSearchParams({ ...baseParams, view: "large" })}`}>Large</Link>
        </Button>
      </div>
      <MediaGrid items={items} density={view} />
      <div className="flex items-center justify-between">
        <div className="text-sm text-[hsl(var(--fg))]/60">
          Showing {Math.min(data.items.length, data.pageSize)} of {data.total}
        </div>
        <div className="flex gap-2">
          {data.page > 1 ? (
            <Button asChild variant="secondary">
              <Link href={`/?${new URLSearchParams({ ...baseParams, page: String(data.page - 1) })}`}>Previous</Link>
            </Button>
          ) : null}
          {data.page < data.totalPages ? (
            <Button asChild>
              <Link href={`/?${new URLSearchParams({ ...baseParams, page: String(data.page + 1) })}`}>Next</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
