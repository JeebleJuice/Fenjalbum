export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Album, ArrowRight, Film, Heart, Images, MapPinned, RefreshCw, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { formatCaptureDate } from "@/lib/date-format";

function previewSrc(media: { id: string; mediaType: "PHOTO" | "VIDEO"; thumbPath: string | null; posterPath: string | null }) {
  if (media.thumbPath) return `/api/media/${media.id}?variant=thumb`;
  if (media.posterPath) return `/api/media/${media.id}?variant=poster`;
  return media.mediaType === "PHOTO" ? `/api/media/${media.id}` : null;
}

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) notFound();

  await connection();
  const readyIds = await prisma.media.findMany({
    where: { trashedAt: null, processingStatus: "READY" },
    select: { id: true }
  });
  const chosenIds = shuffled(readyIds.map(({ id }) => id)).slice(0, 14);
  const [chosenMedia, albums, mediaCount, albumCount, favoriteCount, mappedCount] = await Promise.all([
    prisma.media.findMany({
      where: { id: { in: chosenIds } },
      include: { albums: { include: { album: true }, orderBy: { addedAt: "asc" } } }
    }),
    prisma.album.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      include: {
        memberships: {
          where: { media: { trashedAt: null, processingStatus: "READY" } },
          orderBy: [{ albumOrder: "asc" }, { addedAt: "desc" }],
          include: { media: true },
          take: 1
        },
        _count: { select: { memberships: true } }
      },
      take: 2
    }),
    prisma.media.count({ where: { trashedAt: null } }),
    prisma.album.count(),
    prisma.media.count({ where: { trashedAt: null, favorite: true } }),
    prisma.media.count({ where: { trashedAt: null, latitude: { not: null }, longitude: { not: null } } })
  ]);
  const mediaById = new Map(chosenMedia.map((media) => [media.id, media]));
  const randomMedia = chosenIds.flatMap((id) => {
    const media = mediaById.get(id);
    return media ? [media] : [];
  });
  const hero = randomMedia.slice(0, 5);
  const rail = randomMedia.slice(5);

  return (
    <AppShell user={user} viewport>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <section className="relative min-h-0 flex-1 overflow-hidden rounded-[1.65rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-soft">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-0.5 bg-[hsl(var(--muted))]">
            {hero.length ? hero.map((media, index) => {
              const src = previewSrc(media);
              return src ? (
                <img
                  key={media.id}
                  src={src}
                  alt=""
                  className={`h-full min-h-0 w-full object-cover ${index === 0 ? "col-span-2 row-span-2" : ""}`}
                />
              ) : <div key={media.id} className="bg-[hsl(var(--muted))]" />;
            }) : <div className="col-span-full row-span-full bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))/0.35,transparent_45%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]" />}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,20,.9)_0%,rgba(5,8,20,.66)_48%,rgba(5,8,20,.18)_100%)]" />
          <div className="relative flex h-full max-w-3xl flex-col justify-between p-4 text-white sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] backdrop-blur-xl sm:text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Discover your archive
              </div>
              <div className="rounded-full border border-white/20 bg-black/25 p-2 backdrop-blur-xl" title="A new selection appears on every reload">
                <RefreshCw className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <h1 className="max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">Rediscover what you have captured.</h1>
              <p className="mt-2 hidden max-w-xl text-sm leading-6 text-white/72 sm:block">A fresh selection from your photos and videos every time you arrive, stored privately on your home server.</p>
              <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                <Button asChild className="bg-white text-slate-950 hover:bg-white/90"><Link href="/library">Browse library <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild variant="secondary" className="border-white/25 bg-black/25 text-white hover:bg-black/40"><Link href="/map">Explore map <MapPinned className="h-4 w-4" /></Link></Button>
              </div>
              <div className="no-scrollbar mt-3 flex max-w-full gap-2 overflow-x-auto sm:mt-5">
                {[
                  { label: "Media", value: mediaCount, icon: Images, href: "/library" },
                  { label: "Albums", value: albumCount, icon: Album, href: "/albums" },
                  { label: "Favorites", value: favoriteCount, icon: Heart, href: "/favorites" },
                  { label: "Mapped", value: mappedCount, icon: MapPinned, href: "/map" }
                ].map(({ label, value, icon: Icon, href }) => (
                  <Link key={label} href={href} className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs backdrop-blur-xl transition hover:bg-black/40">
                    <Icon className="h-3.5 w-3.5" /><strong>{value}</strong><span className="text-white/65">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="shrink-0">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <h2 className="truncate text-sm font-semibold">A different selection on every reload</h2>
            <Link href="/albums" className="shrink-0 text-xs font-medium text-[hsl(var(--fg))]/60 hover:text-[hsl(var(--fg))]">All albums</Link>
          </div>
          <div className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1">
            {rail.map((media) => {
              const src = previewSrc(media);
              return (
                <Link key={media.id} href={`/media/${media.id}?returnTo=${encodeURIComponent("/")}`} className="group relative h-24 w-36 shrink-0 snap-start overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] sm:h-28 sm:w-44">
                  {src ? <img src={src} alt={media.title ?? media.originalFilename} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  {media.mediaType === "VIDEO" ? <Film className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" /> : null}
                  <div className="absolute inset-x-0 bottom-0 p-2 text-white"><div className="truncate text-xs font-medium">{media.title ?? media.originalFilename}</div><div className="text-[10px] text-white/65">{formatCaptureDate(media.captureAt)}</div></div>
                </Link>
              );
            })}
            {albums.map((album) => {
              const cover = album.memberships[0]?.media;
              const src = cover ? previewSrc(cover) : null;
              return (
                <Link key={album.id} href={`/albums/${album.id}`} className="group relative h-24 w-36 shrink-0 snap-start overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] sm:h-28 sm:w-44">
                  {src ? <img src={src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <Album className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" />
                  <div className="absolute inset-x-0 bottom-0 p-2 text-white"><div className="truncate text-xs font-medium">{album.title}</div><div className="text-[10px] text-white/65">{album._count.memberships} items</div></div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
