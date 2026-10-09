export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Button, Input, Panel } from "@/components/ui";
import { AlbumCreateForm } from "@/components/album-create-form";
import { Search } from "lucide-react";

export default async function AlbumsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim() ?? "";
  const [albums, albumCount] = await Promise.all([
    prisma.album.findMany({
      where: query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] } : undefined,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        memberships: {
          where: { media: { trashedAt: null } },
          orderBy: [{ albumOrder: "asc" }, { addedAt: "asc" }],
          include: {
            media: {
              select: {
                id: true,
                title: true,
                originalFilename: true,
                mediaType: true,
                thumbPath: true,
                posterPath: true,
                processingStatus: true
              }
            }
          },
          take: 3
        },
        _count: { select: { memberships: { where: { media: { trashedAt: null } } } } }
      }
    }),
    prisma.album.count()
  ]);
  return (
    <AppShell user={user}>
      <Panel className="p-5 sm:p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-[hsl(var(--fg))]/55">Albums</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your collections, without duplicate files.</h1>
        <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg))]/65">
          Albums give your archive structure. Create one below, then add media from the album page or the main gallery.
        </p>
      </Panel>
      <AlbumCreateForm />
      <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold">All albums</h2><p className="text-sm text-[hsl(var(--fg))]/60">Open any collection to browse or add media.</p></div><span className="text-sm text-[hsl(var(--fg))]/50">{query ? `${albums.length} of ${albumCount}` : `${albumCount} total`}</span></div>
          <form method="get" className="mb-4 flex gap-2 rounded-[1.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-soft">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search albums</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--fg))]/45" />
              <Input name="q" defaultValue={query} placeholder="Search albums" className="border-transparent bg-[hsl(var(--muted))] pl-10 shadow-none" />
            </label>
            <Button type="submit">Search</Button>
            {query ? <Button asChild variant="secondary"><Link href="/albums">Clear</Link></Button> : null}
          </form>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {albums.map((album) => (
              <Link key={album.id} href={`/albums/${album.id}`} className="media-card group overflow-hidden rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_50%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]">
                    {album.memberships.length ? (
                      <div className="grid h-full grid-cols-3 gap-1 p-1">
                        {album.memberships.slice(0, 3).map(({ media }, index) => (
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
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full rounded-xl object-cover transition duration-500 group-hover:scale-[1.02]"
                              alt={media.title ?? media.originalFilename}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-lg font-semibold">{album.title}</h3>
                    <p className="line-clamp-2 min-h-10 text-sm text-[hsl(var(--fg))]/60">{album.description ?? "No description"}</p>
                    <p className="text-xs uppercase tracking-wide text-[hsl(var(--fg))]/55">{album._count.memberships} items</p>
                  </div>
              </Link>
            ))}
          </div>
          {!albums.length ? <Panel className="p-10 text-center text-sm text-[hsl(var(--fg))]/60">No albums match “{query}”.</Panel> : null}
      </section>
    </AppShell>
  );
}
