import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildMediaOrderBy, buildMediaWhere, type GalleryFilters } from "@/lib/filters";

export const mediaCardSelect = {
  id: true,
  title: true,
  originalFilename: true,
  mediaType: true,
  thumbPath: true,
  posterPath: true,
  width: true,
  height: true,
  duration: true,
  uploadedAt: true,
  captureAt: true,
  favorite: true,
  processingStatus: true
} satisfies Prisma.MediaSelect;

export const galleryMediaSelect = {
  ...mediaCardSelect,
  albums: {
    select: { album: { select: { title: true } } },
    orderBy: { addedAt: "asc" as const }
  }
} satisfies Prisma.MediaSelect;

export async function getGalleryData(filters: GalleryFilters, options: { loadAlbums?: boolean } = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 28;
  const [total, albums] = await Promise.all([
    prisma.media.count({ where: buildMediaWhere(filters) }),
    options.loadAlbums === false ? Promise.resolve([]) : prisma.album.findMany({ orderBy: { sortOrder: "asc" } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const items = await prisma.media.findMany({
    where: buildMediaWhere(filters),
    select: galleryMediaSelect,
    orderBy: buildMediaOrderBy(filters),
    skip: (currentPage - 1) * pageSize,
    take: pageSize
  });
  return { items, total, albums, pageSize, page: currentPage, totalPages };
}
