import { describe, expect, it } from "vitest";
import { openStreetMapTileUrl, parseMapTileCoordinates } from "@/lib/map-tiles";

describe("map tile coordinates", () => {
  it("accepts a tile inside the selected zoom grid", () => {
    const tile = parseMapTileCoordinates({ z: "11", x: "1070", y: "649" });
    expect(tile).toEqual({ z: 11, x: 1070, y: 649 });
    expect(openStreetMapTileUrl(tile!)).toBe("https://tile.openstreetmap.org/11/1070/649.png");
  });

  it("rejects traversal, excessive zoom, and out-of-grid coordinates", () => {
    expect(parseMapTileCoordinates({ z: "../11", x: "1", y: "1" })).toBeNull();
    expect(parseMapTileCoordinates({ z: "20", x: "1", y: "1" })).toBeNull();
    expect(parseMapTileCoordinates({ z: "3", x: "8", y: "1" })).toBeNull();
  });
});
