import { describe, expect, it } from "vitest";
import { parseRangeHeader } from "@/lib/range";

describe("range parsing", () => {
  it("parses byte ranges", () => {
    expect(parseRangeHeader("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
    expect(parseRangeHeader("bytes=100-", 1000)).toEqual({ start: 100, end: 999 });
  });

  it("rejects invalid ranges", () => {
    expect(parseRangeHeader("bytes=999-100", 1000)).toBeNull();
    expect(parseRangeHeader("none", 1000)).toBeNull();
  });
});
