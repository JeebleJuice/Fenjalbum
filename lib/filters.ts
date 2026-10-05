import { Prisma } from "@prisma/client";

export type GalleryFilters = {
  q?: string;
  mediaType?: "all" | "photo" | "video";
  albumId?: string;
  favorite?: boolean;
  sort?: "newest" | "oldest" | "alpha" | "upload";
  page?: number;
  pageSize?: number;
};

export function buildMediaWhere(filters: GalleryFilters): Prisma.MediaWhereInput {
  const where: Prisma.MediaWhereInput = { trashedAt: null };
  if (filters.q) {
    where.OR = [
      { originalFilename: { contains: filters.q, mode: "insensitive" } },
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: filters.q, mode: "insensitive" } } } } }
    ];
  }
  if (filters.mediaType && filters.mediaType !== "all") {
    where.mediaType = filters.mediaType === "photo" ? "PHOTO" : "VIDEO";
  }
  if (filters.albumId === "unsorted") where.albumId = null;
  else if (filters.albumId) where.albumId = filters.albumId;
  if (filters.favorite) where.favorite = true;
  return where;
}

export function buildMediaOrderBy(filters: GalleryFilters): Prisma.MediaOrderByWithRelationInput[] {
  switch (filters.sort) {
    case "oldest":
      return [{ uploadedAt: "asc" }];
    case "alpha":
      return [{ originalFilename: "asc" }];
    case "upload":
      return [{ uploadedAt: "desc" }];
    case "newest":
    default:
      return [{ captureAt: "desc" }, { uploadedAt: "desc" }];
  }
}
