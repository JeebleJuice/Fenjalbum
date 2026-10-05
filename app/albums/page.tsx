export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui";
import { AlbumCreateForm } from "@/components/album-create-form";

export default async function AlbumsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const albums = await prisma.album.findMany({
    orderBy: { sortOrder: "asc" },
    include: { media: { where: { trashedAt: null } } }
  });
  return (
    <AppShell user={user}>
      <Panel className="p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-[hsl(var(--fg))]/55">Albums</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Group related media into clean, curated sets.</h1>
        <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg))]/65">
          Albums give your archive structure. Create one below, then add media from the album page or the main gallery.
        </p>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AlbumCreateForm />
        <Panel className="p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Existing albums</h2>
            <p className="text-sm text-[hsl(var(--fg))]/60">Open any album to browse its contents.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {albums.map((album) => (
              <Panel key={album.id} className="overflow-hidden">
                <Link href={`/albums/${album.id}`} className="block">
                  <div className="aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_50%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]">
                    {album.media.length ? (
                      <div className="grid h-full grid-cols-3 gap-1 p-1">
                        {album.media.slice(0, 3).map((media, index) => (
                          <div key={media.id} className={index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}>
                            <img
                              src={
                                media.mediaType === "PHOTO"
                                  ? media.thumbPath
                                    ? `/api/media/${media.id}?variant=thumb`
                                    : `/api/media/${media.id}`
                                  : media.thumbPath
                                    ? `/api/media/${media.id}?variant=thumb`
                                    : media.posterPath
                                      ? `/api/media/${media.id}?variant=poster`
                                      : `/api/media/${media.id}`
                              }
                              className="h-full w-full rounded-xl object-cover"
                              alt={media.title ?? media.originalFilename}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-lg font-semibold">{album.title}</h3>
                    <p className="text-sm text-[hsl(var(--fg))]/60">{album.description ?? "No description"}</p>
                    <p className="text-xs uppercase tracking-wide text-[hsl(var(--fg))]/55">{album.media.length} items</p>
                  </div>
                </Link>
              </Panel>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
