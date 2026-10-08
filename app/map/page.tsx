export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPinned } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { PhotoMap } from "@/components/photo-map";
import { Button, Panel } from "@/components/ui";

export default async function MapPage() {
  const user = await getCurrentUser();
  if (!user) notFound();
  const media = await prisma.media.findMany({
    where: { trashedAt: null, latitude: { not: null }, longitude: { not: null } },
    orderBy: [{ captureAt: "desc" }, { uploadedAt: "desc" }],
    take: 5000
  });
  const points = media.flatMap((item) => item.latitude !== null && item.longitude !== null ? [{
    id: item.id,
    title: item.title ?? item.originalFilename,
    latitude: item.latitude,
    longitude: item.longitude,
    capturedAt: item.captureAt?.toISOString() ?? null,
    thumbSrc: item.thumbPath ? `/api/media/${item.id}?variant=thumb` : item.posterPath ? `/api/media/${item.id}?variant=poster` : null
  }] : []);

  return (
    <AppShell user={user}>
      <Panel className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div><p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--fg))]/50">Places</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Memories on the map</h1><p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg))]/60">Nearby coordinates are grouped together. Open a marker to revisit photos and videos captured there.</p></div>
        <div className="text-sm text-[hsl(var(--fg))]/55">{points.length} geotagged items</div>
      </Panel>
      {points.length ? (
        <Panel className="overflow-hidden p-2"><PhotoMap points={points} /></Panel>
      ) : (
        <Panel className="p-10 text-center"><MapPinned className="mx-auto h-8 w-8 text-[hsl(var(--fg))]/35" /><h2 className="mt-3 text-lg font-semibold">No locations yet</h2><p className="mx-auto mt-2 max-w-lg text-sm text-[hsl(var(--fg))]/60">Fenjalbum will place media here when its EXIF or video metadata contains GPS coordinates.</p><Button asChild className="mt-5"><Link href="/upload">Upload geotagged media</Link></Button></Panel>
      )}
    </AppShell>
  );
}
