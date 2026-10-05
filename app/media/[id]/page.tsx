export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { MediaViewer } from "@/components/media-viewer";

export default async function MediaPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();
  const { id } = await params;
  const { returnTo = "/" } = await searchParams;
  const current = await prisma.media.findFirst({
    where: { id, trashedAt: null },
    include: { album: true, tags: { include: { tag: true } } }
  });
  if (!current) notFound();
  const albums = await prisma.album.findMany({ orderBy: { sortOrder: "asc" } });
  const ordered = await prisma.media.findMany({ where: { trashedAt: null }, orderBy: [{ uploadedAt: "desc" }, { id: "desc" }] });
  const index = ordered.findIndex((media) => media.id === id);
  const prevId = index > 0 ? ordered[index - 1]?.id ?? null : null;
  const nextId = index >= 0 && index < ordered.length - 1 ? ordered[index + 1]?.id ?? null : null;

  return (
    <MediaViewer
      item={{
        id: current.id,
        title: current.title,
        description: current.description,
        originalFilename: current.originalFilename,
        mediaType: current.mediaType,
        mimeType: current.mimeType,
        width: current.width,
        height: current.height,
        duration: current.duration,
        uploadedAt: current.uploadedAt.toISOString(),
        captureAt: current.captureAt?.toISOString() ?? null,
        favorite: current.favorite,
        albumId: current.albumId,
        albumTitle: current.album?.title ?? null,
        tags: current.tags.map((relation) => relation.tag.name),
        src: `/api/media/${current.id}${current.playbackPath ? "?variant=playback" : ""}`,
        posterSrc: current.posterPath ? `/api/media/${current.id}?variant=poster` : null,
        returnTo,
        prevId,
        nextId,
        admin: user.role === "ADMIN"
      }}
      albums={albums.map((album) => ({ id: album.id, title: album.title }))}
    />
  );
}
