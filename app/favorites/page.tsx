export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { MediaGrid } from "@/components/gallery";
import { Panel } from "@/components/ui";
import { ProcessingRefresh } from "@/components/processing-refresh";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) notFound();
  const media = await prisma.media.findMany({
    where: { favorite: true, trashedAt: null },
    include: { albums: { include: { album: true }, orderBy: { addedAt: "asc" } } },
    orderBy: [{ uploadedAt: "desc" }]
  });
  return (
    <AppShell user={user}>
      <ProcessingRefresh enabled={media.some((item) => item.processingStatus !== "READY")} />
      <Panel className="p-5">
        <h1 className="text-3xl font-semibold tracking-tight">Favorites</h1>
        <p className="mt-2 text-sm text-[hsl(var(--fg))]/65">Pinned media from across your library.</p>
      </Panel>
      <MediaGrid
        returnTo="/favorites"
        items={media.map((item) => ({
          id: item.id,
          title: item.title,
          originalFilename: item.originalFilename,
          mediaType: item.mediaType,
          thumbSrc:
            item.mediaType === "PHOTO"
              ? item.thumbPath && item.processingStatus === "READY"
                ? `/api/media/${item.id}?variant=thumb`
                : `/api/media/${item.id}`
              : item.processingStatus === "READY" && item.thumbPath
                ? `/api/media/${item.id}?variant=thumb`
                : null,
          posterSrc: item.posterPath ? `/api/media/${item.id}?variant=poster` : null,
          width: item.width,
          height: item.height,
          duration: item.duration,
          uploadedAt: item.uploadedAt.toISOString(),
          captureAt: item.captureAt?.toISOString() ?? null,
          favorite: item.favorite,
          albumTitle: item.albums.map((membership) => membership.album.title).join(", ") || null,
          processingStatus: item.processingStatus
        }))}
      />
    </AppShell>
  );
}
