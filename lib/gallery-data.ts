import { prisma } from "@/lib/db";
import { buildMediaOrderBy, buildMediaWhere, type GalleryFilters } from "@/lib/filters";

export async function getGalleryData(filters: GalleryFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 28;
  const [total, albums] = await Promise.all([
    prisma.media.count({ where: buildMediaWhere(filters) }),
    prisma.album.findMany({ orderBy: { sortOrder: "asc" } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const items = await prisma.media.findMany({
    where: buildMediaWhere(filters),
    include: { albums: { include: { album: true }, orderBy: { addedAt: "asc" } } },
    orderBy: buildMediaOrderBy(filters),
    skip: (currentPage - 1) * pageSize,
    take: pageSize
  });
  return { items, total, albums, pageSize, page: currentPage, totalPages };
}
