/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarDays, Film, Heart, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { Badge, Panel } from "@/components/ui";

export type GalleryItem = {
  id: string;
  title: string | null;
  originalFilename: string;
  mediaType: "PHOTO" | "VIDEO";
  thumbSrc: string | null;
  posterSrc?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  uploadedAt: string;
  captureAt?: string | null;
  favorite: boolean;
  albumTitle?: string | null;
  processingStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
};

export function MediaGrid({
  items,
  density = "large",
  returnTo
}: {
  items: GalleryItem[];
  density?: "compact" | "comfortable" | "large";
  returnTo?: string;
}) {
  const mediaHref = (id: string) => `/media/${id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;
  if (items.length === 0) {
    return (
      <Panel className="p-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
          <ImageIcon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">No media found</h2>
        <p className="mt-2 text-sm text-[hsl(var(--fg))]/60">Adjust filters or upload new photos and videos.</p>
      </Panel>
    );
  }

  if (density === "compact") {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
        {items.map((item) => (
          <Link
            key={item.id}
            href={mediaHref(item.id)}
            className="group overflow-hidden rounded-[1rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="relative overflow-hidden">
              {item.thumbSrc ? (
                <img
                  src={item.thumbSrc}
                  alt={item.title ?? item.originalFilename}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5),_transparent_56%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]">
                  <ImageIcon className="h-3.5 w-3.5 text-[hsl(var(--fg))]/60" />
                </div>
              )}
              {item.favorite ? <div className="absolute right-2 top-2 rounded-full bg-black/55 p-1 text-white backdrop-blur"><Heart className="h-2.5 w-2.5 fill-current" /></div> : null}
            </div>
            <div className="space-y-0.5 p-2">
              <h3 className="truncate text-[11px] font-semibold leading-tight">{item.title ?? item.originalFilename}</h3>
              <div className="flex items-center justify-between gap-2 text-[9px] text-[hsl(var(--fg))]/60">
                <span className="truncate">{item.albumTitle ?? "No Album"}</span>
                <span>{new Date(item.captureAt ?? item.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  if (density === "comfortable") {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={mediaHref(item.id)}
            className="group overflow-hidden rounded-[1.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="relative overflow-hidden">
              {item.thumbSrc ? (
                <img
                  src={item.thumbSrc}
                  alt={item.title ?? item.originalFilename}
                  loading="lazy"
                  className="aspect-[1/1] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex aspect-[1/1] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5),_transparent_56%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]">
                  <ImageIcon className="h-5 w-5 text-[hsl(var(--fg))]/60" />
                </div>
              )}
              {item.favorite ? <div className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white backdrop-blur"><Heart className="h-3 w-3 fill-current" /></div> : null}
            </div>
            <div className="space-y-1 p-3">
              <h3 className="truncate text-sm font-semibold">{item.title ?? item.originalFilename}</h3>
              <div className="flex items-center justify-between gap-2 text-[11px] text-[hsl(var(--fg))]/60">
                <span className="truncate">{item.albumTitle ?? "No Album"}</span>
                <span>{new Date(item.captureAt ?? item.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="masonry columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
      {items.map((item) => (
        <article key={item.id} className="masonry-item">
          <Link
            href={mediaHref(item.id)}
            className="group block overflow-hidden rounded-[1.6rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="relative overflow-hidden">
              {item.thumbSrc ? (
                <>
                  <img
                    src={item.thumbSrc}
                    alt={item.title ?? item.originalFilename}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                </>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5),_transparent_56%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]">
                  <div className="text-center">
                    {item.processingStatus === "FAILED" ? (
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--danger))]/15 text-[hsl(var(--danger))]">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--fg))]/8 text-[hsl(var(--fg))]/70">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    )}
                    <div className="text-sm font-medium">
                      {item.processingStatus === "READY" ? "Preview loading" : item.processingStatus === "FAILED" ? "Processing failed" : "Processing upload"}
                    </div>
                    <div className="mt-1 text-xs text-[hsl(var(--fg))]/55">
                      {item.processingStatus === "FAILED" ? "Check Admin > Media" : "Thumbnail will appear shortly"}
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute left-3 top-3 flex gap-2">
                {item.mediaType === "VIDEO" ? (
                  <div className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                    <Film className="mr-1 inline h-3.5 w-3.5" />
                    Video
                  </div>
                ) : (
                  <div className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                    Photo
                  </div>
                )}
                {item.processingStatus !== "READY" ? (
                  <div className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                    <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                    {item.processingStatus === "FAILED" ? "Failed" : "Processing"}
                  </div>
                ) : null}
              </div>
              {item.favorite ? (
                <div className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white backdrop-blur">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                </div>
              ) : null}
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{item.title ?? item.originalFilename}</h3>
                  <p className="truncate text-xs text-[hsl(var(--fg))]/60">{item.originalFilename}</p>
                </div>
                <Badge>{item.albumTitle ?? "No Album"}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-[hsl(var(--fg))]/60">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(item.captureAt ?? item.uploadedAt).toLocaleDateString()}
                </span>
                {item.duration ? <span>{Math.round(item.duration)}s</span> : item.width && item.height ? <span>{item.width}×{item.height}</span> : null}
              </div>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
