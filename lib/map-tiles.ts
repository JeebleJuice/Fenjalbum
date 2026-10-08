export type MapTileCoordinates = { z: number; x: number; y: number };

export function parseMapTileCoordinates(values: { z: string; x: string; y: string }): MapTileCoordinates | null {
  if (![values.z, values.x, values.y].every((value) => /^\d+$/.test(value))) return null;
  const z = Number(values.z);
  const x = Number(values.x);
  const y = Number(values.y);
  if (!Number.isSafeInteger(z) || !Number.isSafeInteger(x) || !Number.isSafeInteger(y) || z < 0 || z > 19) return null;
  const edge = 2 ** z;
  if (x < 0 || y < 0 || x >= edge || y >= edge) return null;
  return { z, x, y };
}

export function openStreetMapTileUrl(tile: MapTileCoordinates) {
  return `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
}
