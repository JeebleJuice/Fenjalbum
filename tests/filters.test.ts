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
    expect(buildMediaOrderBy({ sort: "newest" })).toEqual([{ captureAt: "desc" }, { uploadedAt: "desc" }]);
  });

  it("turns a date search into capture bounds instead of text search", () => {
    const where = buildMediaWhere({ q: "21/03/2026 - 25/4/2026" });
    expect(where.OR).toBeUndefined();
    expect(where.captureAt).toEqual({
      gte: new Date("2026-03-21T00:00:00.000Z"),
      lte: new Date("2026-04-25T23:59:59.999Z")
    });
  });
});
