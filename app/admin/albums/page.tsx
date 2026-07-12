export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Button, Panel } from "@/components/ui";

export default async function AdminAlbumsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();
  const albums = await prisma.album.findMany({
    orderBy: [{ sortOrder: "asc" }],
    include: { media: true }
  });
  return (
    <AppShell user={user}>
      <Panel className="p-5">
        <h1 className="text-3xl font-semibold tracking-tight">Albums</h1>
        <p className="mt-2 text-sm text-[hsl(var(--fg))]/65">Album administration and organization.</p>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {albums.map((album) => (
          <Panel key={album.id} className="p-4">
            <div className="font-semibold">{album.title}</div>
            <div className="mt-1 text-sm text-[hsl(var(--fg))]/60">{album.description ?? "No description"}</div>
            <div className="mt-3 text-xs text-[hsl(var(--fg))]/55">{album.media.length} media items</div>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="secondary"><Link href={`/albums/${album.id}`}>Open</Link></Button>
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
