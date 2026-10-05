"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Download, Edit3, Heart, Trash2, X } from "lucide-react";
import { Button, Input, Panel, Select, Textarea } from "@/components/ui";

export type ViewerItem = {
  id: string;
  title: string | null;
  description: string | null;
  originalFilename: string;
  mediaType: "PHOTO" | "VIDEO";
  mimeType: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  uploadedAt: string;
  captureAt: string | null;
  favorite: boolean;
  albumId: string | null;
  albumTitle: string | null;
  tags: string[];
  src: string;
  posterSrc: string | null;
  returnTo: string;
  prevId: string | null;
  nextId: string | null;
  admin: boolean;
};

function localDateTimeValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function MediaViewer({
  item,
  albums
}: {
  item: ViewerItem;
  albums: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [favorite, setFavorite] = useState(item.favorite);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push(item.returnTo);
      if (event.key === "ArrowLeft" && item.prevId) router.replace(`/media/${item.prevId}?returnTo=${encodeURIComponent(item.returnTo)}`);
      if (event.key === "ArrowRight" && item.nextId) router.replace(`/media/${item.nextId}?returnTo=${encodeURIComponent(item.returnTo)}`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item.nextId, item.prevId, item.returnTo, router]);

  async function toggleFavorite() {
    const response = await fetch(`/api/media/${item.id}/favorite`, {
      method: favorite ? "DELETE" : "POST",
      headers: { "x-csrf-token": document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? "" }
    });
    if (response.ok) setFavorite(!favorite);
  }

  async function saveMetadata(formData: FormData) {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/media/${item.id}/metadata`, {
        method: "PATCH",
        headers: { "x-csrf-token": document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? "" },
        body: formData
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Save failed");
      setEditing(false);
      setStatus("Saved.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMedia() {
    if (!confirm("Move this item to trash? You can restore it from Admin.")) return;
    const response = await fetch(`/api/media/${item.id}`, {
      method: "DELETE",
      headers: { "x-csrf-token": document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? "" }
    });
    if (response.ok) router.push(item.returnTo);
  }

  const currentSrc = item.mediaType === "VIDEO" ? item.src : item.src;
  const downloadSrc = `/api/media/${item.id}?download=1`;

  return (
    <div className="fixed inset-0 z-50 bg-[hsl(var(--bg))]">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/90 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="secondary" onClick={() => router.push(item.returnTo)}>
            <X className="h-4 w-4" />
            Close
          </Button>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{item.title ?? item.originalFilename}</div>
            <div className="truncate text-xs text-[hsl(var(--fg))]/60">
              {item.albumTitle ?? "No album"} · {new Date(item.uploadedAt).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={toggleFavorite}>
            <Heart className={favorite ? "h-4 w-4 fill-current" : "h-4 w-4"} />
          </Button>
          <Button variant="secondary" asChild>
            <a href={downloadSrc} download>
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          {item.admin ? (
            <Button variant="danger" onClick={deleteMedia}>
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid h-full pt-16 lg:grid-cols-[1fr_20rem]">
        <div className="relative flex items-center justify-center overflow-hidden">
          {item.mediaType === "VIDEO" ? (
            <video
              className="h-full max-h-[calc(100vh-4rem)] w-full object-contain"
              src={currentSrc}
              poster={item.posterSrc ?? undefined}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={currentSrc}
              alt={item.title ?? item.originalFilename}
              className="max-h-[calc(100vh-4rem)] max-w-full object-contain"
            />
          )}

          <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 lg:block">
            {item.prevId ? (
              <Button variant="secondary" onClick={() => router.replace(`/media/${item.prevId}?returnTo=${encodeURIComponent(item.returnTo)}`)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block">
            {item.nextId ? (
              <Button variant="secondary" onClick={() => router.replace(`/media/${item.nextId}?returnTo=${encodeURIComponent(item.returnTo)}`)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <aside className="border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <Panel className="space-y-3 p-4">
            <div>
              <div className="text-sm font-semibold">Details</div>
              <div className="mt-1 text-xs text-[hsl(var(--fg))]/60">
                {item.width && item.height ? `${item.width} × ${item.height}` : "Dimensions unavailable"}
                {item.duration ? ` · ${Math.round(item.duration)}s` : ""}
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--fg))]/60">Filename</dt>
                <dd className="text-right">{item.originalFilename}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--fg))]/60">Capture date</dt>
                <dd className="text-right">{item.captureAt ? new Date(item.captureAt).toLocaleString() : "Unknown"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--fg))]/60">Upload date</dt>
                <dd className="text-right">{new Date(item.uploadedAt).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[hsl(var(--fg))]/60">Album</dt>
                <dd className="text-right">{item.albumTitle ?? "No album"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </Panel>

          {editing ? (
            <Panel className="mt-4 space-y-3 p-4">
              <div className="text-sm font-semibold">Edit metadata</div>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveMetadata(new FormData(event.currentTarget));
                }}
              >
                <Input name="title" defaultValue={item.title ?? ""} placeholder="Title" />
                <Textarea name="description" defaultValue={item.description ?? ""} placeholder="Description" />
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="captureAt">Capture date</label>
                  <Input id="captureAt" name="captureAt" type="datetime-local" defaultValue={localDateTimeValue(item.captureAt)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Album</label>
                  <Select name="albumId" defaultValue={item.albumId ?? ""}>
                    <option value="">No album</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <Input name="tags" defaultValue={item.tags.join(", ")} placeholder="comma, separated, tags" />
                <input type="hidden" name="favorite" value={String(favorite)} />
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  {status ? <p className="text-sm text-[hsl(var(--fg))]/65">{status}</p> : null}
                </div>
              </form>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
