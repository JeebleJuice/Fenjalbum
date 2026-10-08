export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Album, ArrowRight, CalendarDays, Images, MapPinned, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { MediaGrid } from "@/components/gallery";
import { Button } from "@/components/ui";

function previewSrc(media: { id: string; mediaType: "PHOTO" | "VIDEO"; thumbPath: string | null; posterPath: string | null }) {
  if (media.thumbPath) return `/api/media/${media.id}?variant=thumb`;
  if (media.posterPath) return `/api/media/${media.id}?variant=poster`;
  return media.mediaType === "PHOTO" ? `/api/media/${media.id}` : null;
}

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) notFound();
  const [recent, albums, mediaCount, albumCount, favoriteCount, mappedCount] = await Promise.all([
    prisma.media.findMany({
      where: { trashedAt: null, processingStatus: "READY" },
      include: { albums: { include: { album: true }, orderBy: { addedAt: "asc" } } },
      orderBy: [{ captureAt: "desc" }, { uploadedAt: "desc" }],
      take: 12
    }),
    prisma.album.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      include: {
        memberships: {
          where: { media: { trashedAt: null, processingStatus: "READY" } },
          orderBy: [{ albumOrder: "asc" }, { addedAt: "desc" }],
          include: { media: true },
          take: 4
        },
        _count: { select: { memberships: true } }
      },
      take: 6
    }),
    prisma.media.count({ where: { trashedAt: null } }),
    prisma.album.count(),
    prisma.media.count({ where: { trashedAt: null, favorite: true } }),
    prisma.media.count({ where: { trashedAt: null, latitude: { not: null }, longitude: { not: null } } })
  ]);
  const hero = recent.slice(0, 5);
  const recentItems = recent.slice(5).map((media) => ({
    id: media.id,
    title: media.title,
    originalFilename: media.originalFilename,
    mediaType: media.mediaType,
    thumbSrc: previewSrc(media),
    posterSrc: media.posterPath ? `/api/media/${media.id}?variant=poster` : null,
    width: media.width,
    height: media.height,
    duration: media.duration,
    uploadedAt: media.uploadedAt.toISOString(),
    captureAt: media.captureAt?.toISOString() ?? null,
    favorite: media.favorite,
    albumTitle: media.albums.map((membership) => membership.album.title).join(", ") || null,
    processingStatus: media.processingStatus
  }));

  return (
    <AppShell user={user}>
      <section className="relative min-h-[32rem] overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-soft">
        <div className="absolute inset-0 grid grid-cols-2 gap-1 bg-[hsl(var(--muted))] sm:grid-cols-4">
          {hero.length ? hero.map((media, index) => {
            const src = previewSrc(media);
            return src ? (
              <img
                key={media.id}
                src={src}
                alt=""
                className={`h-full w-full object-cover ${index === 0 ? "col-span-2 row-span-2" : "min-h-40"}`}
              />
            ) : <div key={media.id} className="bg-[hsl(var(--muted))]" />;
          }) : <div className="col-span-full bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))/0.35,transparent_45%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]" />}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,20,.88)_0%,rgba(5,8,20,.63)_46%,rgba(5,8,20,.15)_100%)]" />
        <div className="relative flex min-h-[32rem] max-w-2xl flex-col justify-end p-6 text-white sm:p-10 lg:p-14">
          <div className="mb-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5" /> Your private archive
          </div>
          <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">Rediscover what you have captured.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/72 sm:text-base">Fenjalbum brings recent memories, albums, places and dates together without sending your originals outside your home server.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-slate-950 hover:bg-white/90"><Link href="/library">Browse library <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="secondary" className="border-white/25 bg-black/25 text-white hover:bg-black/40"><Link href="/map">Explore the map <MapPinned className="h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Library", value: mediaCount, icon: Images, href: "/library" },
          { label: "Albums", value: albumCount, icon: Album, href: "/albums" },
          { label: "Mapped memories", value: mappedCount, icon: MapPinned, href: "/map" }
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="group flex items-center justify-between rounded-[1.4rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]/90 p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl">
            <div><div className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--fg))]/45">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div></div>
            <span className="rounded-2xl bg-[hsl(var(--muted))] p-3 transition group-hover:bg-[hsl(var(--accent))] group-hover:text-[hsl(var(--accent-fg))]"><Icon className="h-5 w-5" /></span>
          </Link>
        ))}
      </section>

      {albums.length ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--fg))]/45">Collections</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Open an album</h2></div>
            <Link href="/albums" className="text-sm font-medium text-[hsl(var(--fg))]/60 hover:text-[hsl(var(--fg))]">View all</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {albums.map((album) => {
              const cover = album.memberships[0]?.media;
              const src = cover ? previewSrc(cover) : null;
              return (
                <Link key={album.id} href={`/albums/${album.id}`} className="group relative min-h-56 overflow-hidden rounded-[1.6rem] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] shadow-soft">
                  {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white"><h3 className="text-xl font-semibold">{album.title}</h3><p className="mt-1 text-sm text-white/65">{album._count.memberships} items</p></div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {recentItems.length ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--fg))]/45">Latest</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Recently captured</h2></div>
            <div className="flex items-center gap-4"><span className="hidden items-center gap-1 text-xs text-[hsl(var(--fg))]/50 sm:inline-flex"><CalendarDays className="h-4 w-4" /> Ordered by capture date</span><Link href="/favorites" className="text-sm font-medium text-[hsl(var(--fg))]/60 hover:text-[hsl(var(--fg))]">{favoriteCount} favorites</Link></div>
          </div>
          <MediaGrid items={recentItems} density="comfortable" returnTo="/" />
        </section>
      ) : null}
    </AppShell>
  );
}
