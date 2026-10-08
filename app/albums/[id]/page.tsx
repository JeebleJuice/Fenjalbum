export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { MediaGrid } from "@/components/gallery";
import { Button, Panel } from "@/components/ui";
import { AlbumPageActions } from "@/components/album-page-actions";
import { ProcessingRefresh } from "@/components/processing-refresh";

export default async function AlbumPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();
  const { id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const view = query.view === "compact" ? "compact" : query.view === "comfortable" ? "comfortable" : "large";
  const pageSize = view === "compact" ? 24 : view === "comfortable" ? 12 : 6;

  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      memberships: {
        where: { media: { trashedAt: null } },
        orderBy: [{ albumOrder: "asc" }, { addedAt: "asc" }],
        include: { media: { include: { albums: { include: { album: true }, orderBy: { addedAt: "asc" } } } } }
      }
    }
  });
  if (!album) notFound();
  const albumMedia = album.memberships.map((membership) => membership.media);

  const availableMedia = await prisma.media.findMany({
    where: { albums: { none: { albumId: album.id } }, trashedAt: null },
    include: { albums: { include: { album: true }, orderBy: { addedAt: "asc" } } },
    orderBy: [{ uploadedAt: "desc" }],
    take: 24
  });

  const pickerItems = availableMedia.map((media) => ({
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
    uploadedAt: media.uploadedAt.toISOString(),
    albumTitle: media.albums.map((membership) => membership.album.title).join(", ") || null,
    processingStatus: media.processingStatus
  }));

  const hasProcessing = albumMedia.some((media) => media.processingStatus !== "READY");
  const totalPages = Math.max(1, Math.ceil(albumMedia.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedMedia = albumMedia.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pagedItems = pagedMedia.map((media) => ({
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
    albumTitle: album.title,
    processingStatus: media.processingStatus
  }));
  const viewHref = (nextView: "compact" | "comfortable" | "large") => {
    const next = new URLSearchParams(query);
    next.set("view", nextView);
    next.delete("page");
    return `/albums/${album.id}?${next.toString()}`;
  };
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(query);
    next.set("view", view);
    next.set("page", String(nextPage));
    return `/albums/${album.id}?${next.toString()}`;
  };

  return (
    <AppShell user={user}>
      <ProcessingRefresh enabled={hasProcessing} />
      <Panel className="overflow-hidden p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[hsl(var(--fg))]/55">Album</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{album.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg))]/65">{album.description ?? "No description"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button asChild variant={view === "compact" ? "primary" : "secondary"}>
                <Link href={viewHref("compact")}>Compact</Link>
              </Button>
              <Button asChild variant={view === "comfortable" ? "primary" : "secondary"}>
                <Link href={viewHref("comfortable")}>Comfortable</Link>
              </Button>
              <Button asChild variant={view === "large" ? "primary" : "secondary"}>
                <Link href={viewHref("large")}>Large</Link>
              </Button>
            </div>
            <AlbumPageActions albumId={album.id} albumTitle={album.title} pickerItems={pickerItems} />
          </div>
        </div>
      </Panel>

      <MediaGrid items={pagedItems} density={view} returnTo={`/albums/${album.id}?view=${view}&page=${currentPage}`} />

      <div className="flex items-center justify-between">
        <div className="text-sm text-[hsl(var(--fg))]/60">
          Showing {Math.min(pageSize, pagedMedia.length)} of {albumMedia.length}
        </div>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Button asChild variant="secondary">
              <Link href={pageHref(currentPage - 1)}>Previous</Link>
            </Button>
          ) : null}
          {currentPage < totalPages ? (
            <Button asChild>
              <Link href={pageHref(currentPage + 1)}>Next</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
