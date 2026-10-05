import { describe, expect, it } from "vitest";
import { buildMediaWhere, buildMediaOrderBy } from "@/lib/filters";

describe("gallery filters", () => {
  it("builds album and search filters", () => {
    expect(buildMediaWhere({ q: "sunset", albumId: "abc", favorite: true, mediaType: "photo" })).toMatchObject({
      albumId: "abc",
      favorite: true,
      mediaType: "PHOTO",
      trashedAt: null
    });
  });

  it("builds sort order", () => {
    expect(buildMediaOrderBy({ sort: "oldest" })).toEqual([{ uploadedAt: "asc" }]);
    expect(buildMediaOrderBy({ sort: "newest" })).toEqual([{ captureAt: "desc" }, { uploadedAt: "desc" }]);
  });
});
