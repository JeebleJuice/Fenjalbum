"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus } from "lucide-react";
import { Badge, Button, Panel } from "@/components/ui";

type PickerItem = {
  id: string;
  title: string | null;
  originalFilename: string;
  mediaType: "PHOTO" | "VIDEO";
  thumbSrc: string | null;
  uploadedAt: string;
  albumTitle: string | null;
  processingStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
};

export function AlbumMediaPicker({
  albumId,
  albumTitle,
  items
}: {
  albumId: string;
  albumTitle: string;
  items: PickerItem[];
}) {
  const router = useRouter();
  const [csrf, setCsrf] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/csrf", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { csrf?: string }) => setCsrf(data.csrf ?? ""))
      .catch(() => setCsrf(""));
  }, []);

  const selectedCount = useMemo(() => selected.size, [selected]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addSelected() {
    if (!selected.size || !csrf) return;
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/albums/${albumId}/media`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf
        },
        body: JSON.stringify({ mediaIds: Array.from(selected) })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to add media");
      setSelected(new Set());
      setStatus(`Added ${selected.size} item${selected.size === 1 ? "" : "s"} to ${albumTitle}.`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to add media");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[hsl(var(--fg))]/55">From gallery</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Add existing media to this album</h2>
          <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg))]/65">
            Select items from your gallery and move them into {albumTitle} without reuploading.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{selectedCount} selected</Badge>
          <Button type="button" onClick={addSelected} disabled={!selectedCount || loading || !csrf}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add to album
          </Button>
        </div>
      </div>

      {status ? <p className="mt-3 text-sm text-[hsl(var(--fg))]/65">{status}</p> : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.length ? (
          items.map((item) => {
            const active = selected.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={[
                  "group relative overflow-hidden rounded-[1.5rem] border text-left transition duration-300",
                  active
                    ? "border-[hsl(var(--accent))] bg-[hsl(var(--card))] shadow-2xl shadow-[hsl(var(--accent))]/10"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-soft hover:-translate-y-0.5 hover:shadow-2xl"
                ].join(" ")}
              >
                <div className="relative">
                  {item.thumbSrc ? (
                    <img
                      src={item.thumbSrc}
                      alt={item.title ?? item.originalFilename}
                      className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5),_transparent_56%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]">
                      <div className="text-center">
                        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--fg))]/8 text-[hsl(var(--fg))]/70">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                        <div className="text-sm font-medium">
                          {item.processingStatus === "FAILED" ? "Failed" : "Processing"}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-2">
                    <Badge className="bg-black/55 text-white">{item.mediaType}</Badge>
                    <Badge className="bg-black/55 text-white">{item.albumTitle ?? "No album"}</Badge>
                  </div>
                  <div
                    className={[
                      "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border transition",
                      active
                        ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-fg))]"
                        : "border-white/30 bg-black/35 text-white backdrop-blur"
                    ].join(" ")}
                  >
                    {active ? <Check className="h-4 w-4" /> : null}
                  </div>
                </div>
                <div className="space-y-1 p-4">
                  <h3 className="truncate text-sm font-semibold">{item.title ?? item.originalFilename}</h3>
                  <p className="truncate text-xs text-[hsl(var(--fg))]/60">{item.originalFilename}</p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-full rounded-[1.5rem] border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--fg))]/60">
            No gallery items available to add right now.
          </div>
        )}
      </div>
    </Panel>
  );
}
