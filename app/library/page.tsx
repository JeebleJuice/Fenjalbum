export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGalleryData } from "@/lib/gallery-data";
import { explicitDateBounds } from "@/lib/date-search";
import { FilterBar } from "@/components/filter-bar";
import { MediaGrid } from "@/components/gallery";
import { AppShell } from "@/components/app-shell";
import { Button, Panel } from "@/components/ui";
import { ProcessingRefresh } from "@/components/processing-refresh";
import { GalleryPagination } from "@/components/pagination";

export default async function LibraryPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();
  const params = await searchParams;
  const stringParams = Object.fromEntries(
    Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")
  );
  const baseParams = Object.fromEntries(Object.entries(stringParams).filter(([key]) => key !== "page"));
  const view = params.view === "compact" ? "compact" : params.view === "comfortable" ? "comfortable" : "large";
  const pageSize = view === "compact" ? 48 : view === "comfortable" ? 24 : 12;
  const dates = explicitDateBounds(
    typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    typeof params.dateTo === "string" ? params.dateTo : undefined
  );
  const data = await getGalleryData({
    q: typeof params.q === "string" ? params.q : undefined,
    mediaType: typeof params.mediaType === "string" ? (params.mediaType as "all" | "photo" | "video") : "all",
    albumId: typeof params.albumId === "string" ? params.albumId : undefined,
    captureFrom: dates.from,
    captureTo: dates.to,
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
    albumTitle: media.albums.map((membership) => membership.album.title).join(", ") || null,
    processingStatus: media.processingStatus
  }));
  const returnQuery = new URLSearchParams(stringParams).toString();
  const returnTo = `/library${returnQuery ? `?${returnQuery}` : ""}`;
  const pageHref = (page: number) => {
    const next = new URLSearchParams(baseParams);
    if (page > 1) next.set("page", String(page));
    const query = next.toString();
    return `/library${query ? `?${query}` : ""}`;
  };

  return (
    <AppShell user={user}>
      <ProcessingRefresh enabled={data.items.some((media) => media.processingStatus !== "READY")} />
      <Panel className="overflow-hidden p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[hsl(var(--fg))]/50">Library</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Every memory, easy to find.</h1>
            <p className="mt-1 text-sm text-[hsl(var(--fg))]/60">Search names, tags, and albums, then narrow the results with the filters.</p>
          </div>
          <span className="text-sm text-[hsl(var(--fg))]/55">{data.total} items</span>
        </div>
      </Panel>
      <FilterBar albums={data.albums.map((album) => ({ id: album.id, title: album.title }))} query={stringParams} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--fg))]/45">View</span>
        {(["compact", "comfortable", "large"] as const).map((nextView) => (
          <Button key={nextView} asChild variant={view === nextView ? "primary" : "secondary"} className="px-3 py-1.5 text-xs capitalize">
            <Link href={`/library?${new URLSearchParams({ ...baseParams, view: nextView })}`}>{nextView}</Link>
          </Button>
        ))}
      </div>
      <MediaGrid items={items} density={view} returnTo={returnTo} />
      <GalleryPagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} hrefForPage={pageHref} />
    </AppShell>
  );
}
