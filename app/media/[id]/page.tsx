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
    include: {
      albums: { include: { album: true }, orderBy: { addedAt: "asc" } },
      tags: { include: { tag: true } }
    }
  });
  if (!current) notFound();
  const albums = await prisma.album.findMany({ orderBy: { sortOrder: "asc" } });
  const [previous, next] = await Promise.all([
    prisma.media.findFirst({
      where: {
        trashedAt: null,
        OR: [
          { uploadedAt: { gt: current.uploadedAt } },
          { uploadedAt: current.uploadedAt, id: { gt: current.id } }
        ]
      },
      orderBy: [{ uploadedAt: "asc" }, { id: "asc" }],
      select: { id: true }
    }),
    prisma.media.findFirst({
      where: {
        trashedAt: null,
        OR: [
          { uploadedAt: { lt: current.uploadedAt } },
          { uploadedAt: current.uploadedAt, id: { lt: current.id } }
        ]
      },
      orderBy: [{ uploadedAt: "desc" }, { id: "desc" }],
      select: { id: true }
    })
  ]);

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
        albumIds: current.albums.map((membership) => membership.albumId),
        albumTitles: current.albums.map((membership) => membership.album.title),
        tags: current.tags.map((relation) => relation.tag.name),
        src: `/api/media/${current.id}${current.playbackPath ? "?variant=playback" : ""}`,
        posterSrc: current.posterPath ? `/api/media/${current.id}?variant=poster` : null,
        returnTo,
        prevId: previous?.id ?? null,
        nextId: next?.id ?? null,
        admin: user.role === "ADMIN"
      }}
      albums={albums.map((album) => ({ id: album.id, title: album.title }))}
    />
  );
}
