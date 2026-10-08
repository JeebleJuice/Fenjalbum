import { Prisma } from "@prisma/client";

export type GalleryFilters = {
  q?: string;
  mediaType?: "all" | "photo" | "video";
  albumId?: string;
  captureFrom?: Date;
  captureTo?: Date;
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
      { tags: { some: { tag: { name: { contains: filters.q, mode: "insensitive" } } } } },
      { albums: { some: { album: { title: { contains: filters.q, mode: "insensitive" } } } } }
    ];
  }
  const captureFrom = filters.captureFrom;
  const captureTo = filters.captureTo;
  if (captureFrom || captureTo) {
    where.captureAt = {
      ...(captureFrom ? { gte: captureFrom } : {}),
      ...(captureTo ? { lte: captureTo } : {})
    };
  }
  if (filters.mediaType && filters.mediaType !== "all") {
    where.mediaType = filters.mediaType === "photo" ? "PHOTO" : "VIDEO";
  }
  if (filters.albumId === "unsorted") where.albums = { none: {} };
  else if (filters.albumId) where.albums = { some: { albumId: filters.albumId } };
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
