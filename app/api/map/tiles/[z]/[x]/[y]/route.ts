import { requireUser } from "@/lib/auth";
import { openStreetMapTileUrl, parseMapTileCoordinates } from "@/lib/map-tiles";

export const runtime = "nodejs";

const TILE_CACHE_SECONDS = 60 * 60 * 24 * 7;

export async function GET(request: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  await requireUser();
  const tile = parseMapTileCoordinates(await params);
  if (!tile) return Response.json({ error: "Invalid tile coordinates" }, { status: 400 });

  const upstream = await fetch(openStreetMapTileUrl(tile), {
    headers: {
      "User-Agent": "Fenjalbum/0.1 (+https://jeeblejuice.dk)",
      ...(request.headers.get("referer") ? { Referer: request.headers.get("referer") as string } : {})
    },
    next: { revalidate: TILE_CACHE_SECONDS }
  });
  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: "Map tile provider unavailable" }, { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "image/png",
    "Cache-Control": upstream.headers.get("cache-control") ?? `public, max-age=${TILE_CACHE_SECONDS}`
  });
  for (const header of ["etag", "last-modified"]) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }
  return new Response(upstream.body, { headers });
}
