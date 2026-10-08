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
    <AppShell user={user} viewport>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <Panel className="flex shrink-0 items-end justify-between gap-3 p-4 sm:p-5">
          <div><p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--fg))]/50">Places</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Memories on the map</h1><p className="mt-1 hidden max-w-2xl text-sm text-[hsl(var(--fg))]/60 sm:block">Nearby coordinates are grouped together. Open a marker to revisit media captured there.</p></div>
          <div className="shrink-0 text-sm text-[hsl(var(--fg))]/55">{points.length} items</div>
        </Panel>
        {points.length ? (
          <Panel className="min-h-0 flex-1 overflow-hidden p-2"><PhotoMap points={points} /></Panel>
        ) : (
          <Panel className="flex min-h-0 flex-1 flex-col items-center justify-center p-8 text-center"><MapPinned className="h-8 w-8 text-[hsl(var(--fg))]/35" /><h2 className="mt-3 text-lg font-semibold">No locations yet</h2><p className="mt-2 max-w-lg text-sm text-[hsl(var(--fg))]/60">Fenjalbum will place media here when its metadata contains GPS coordinates.</p><Button asChild className="mt-5"><Link href="/upload">Upload geotagged media</Link></Button></Panel>
        )}
      </div>
    </AppShell>
  );
}
