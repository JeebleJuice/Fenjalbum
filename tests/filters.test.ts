import { describe, expect, it } from "vitest";
import { buildMediaWhere, buildMediaOrderBy } from "@/lib/filters";

describe("gallery filters", () => {
  it("builds album and search filters", () => {
    expect(buildMediaWhere({ q: "sunset", albumId: "abc", favorite: true, mediaType: "photo" })).toMatchObject({
      albums: { some: { albumId: "abc" } },
      favorite: true,
      mediaType: "PHOTO",
      trashedAt: null
    });
  });

  it("builds sort order", () => {
    expect(buildMediaOrderBy({ sort: "oldest" })).toEqual([{ uploadedAt: "asc" }]);
    expect(buildMediaOrderBy({ sort: "newest" })).toEqual([{ captureAt: { sort: "desc", nulls: "last" } }, { uploadedAt: "desc" }]);
  });

  it("keeps free text and date filters as separate concerns", () => {
    const where = buildMediaWhere({ q: "21/03/2026 - 25/4/2026" });
    expect(where.OR).toBeDefined();
    expect(where.captureAt).toBeUndefined();
  });
});
