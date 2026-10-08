import { describe, expect, it } from "vitest";
import { paginationItems } from "@/lib/pagination";

describe("paginationItems", () => {
  it("shows every page for short result sets", () => {
    expect(paginationItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the current page and both ends available", () => {
    expect(paginationItems(8, 20)).toEqual([1, "ellipsis", 7, 8, 9, "ellipsis", 20]);
  });

  it("expands the final pages near the end", () => {
    expect(paginationItems(19, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
  });
});
