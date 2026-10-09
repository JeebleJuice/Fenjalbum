"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { formatDisplayDateTime } from "@/lib/date-format";

type DuplicatePair = {
  distance: number;
  undated: { id: string; filename: string; albums: string[]; uploadedAt: string };
  dated: { id: string; filename: string; albums: string[]; captureAt: string };
};

export function DuplicateReview({ pairs }: { pairs: DuplicatePair[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(() => new Set<string>());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const visible = pairs.filter((pair) => !hidden.has(pair.undated.id));

  async function merge(pair: DuplicatePair) {
    if (!confirm("Keep the dated photo and move the metadata-free copy to Trash? Album memberships, tags, and favourites will be preserved.")) return;
    setBusy(pair.undated.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/duplicates/merge", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? ""
        },
        body: JSON.stringify({ duplicateId: pair.undated.id, keeperId: pair.dated.id })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Merge failed");
      setHidden((current) => new Set(current).add(pair.undated.id));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Merge failed");
    } finally {
      setBusy(null);
    }
  }

  if (!visible.length) {
    return (
      <Panel className="p-10 text-center">
        <Check className="mx-auto h-8 w-8 text-emerald-500" />
        <h2 className="mt-3 text-lg font-semibold">No likely undated duplicates found</h2>
        <p className="mt-1 text-sm text-[hsl(var(--fg))]/60">This page only suggests close visual matches; it never removes photos automatically.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Panel className="border-red-500/40 p-4 text-sm text-red-600 dark:text-red-300">{error}</Panel> : null}
      {visible.map((pair) => (
        <Panel key={pair.undated.id} className="overflow-hidden p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <PhotoCandidate
              label="Metadata-free copy"
              id={pair.undated.id}
              filename={pair.undated.filename}
              detail={`Uploaded ${formatDisplayDateTime(pair.undated.uploadedAt)}`}
              albums={pair.undated.albums}
            />
            <PhotoCandidate
              label="Dated copy to keep"
              id={pair.dated.id}
              filename={pair.dated.filename}
              detail={`Captured ${formatDisplayDateTime(pair.dated.captureAt)}`}
              albums={pair.dated.albums}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4">
            <p className="text-xs text-[hsl(var(--fg))]/55">Visual difference score: {pair.distance} · lower is more similar</p>
            <Button disabled={busy === pair.undated.id} onClick={() => void merge(pair)}>
              {busy === pair.undated.id ? "Merging..." : "Keep dated copy and merge"}
            </Button>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function PhotoCandidate({ label, id, filename, detail, albums }: { label: string; id: string; filename: string; detail: string; albums: string[] }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-[hsl(var(--fg))]/55">{label}</span>
        <Link href={`/media/${id}?returnTo=${encodeURIComponent("/admin/duplicates")}`} className="inline-flex items-center gap-1 text-xs font-medium hover:underline">
          Inspect <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
      <img src={`/api/media/${id}?variant=thumb`} alt={filename} loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-2xl bg-[hsl(var(--muted))] object-contain" />
      <p className="mt-2 truncate text-sm font-medium">{filename}</p>
      <p className="text-xs text-[hsl(var(--fg))]/60">{detail}</p>
      <p className="mt-1 truncate text-xs text-[hsl(var(--fg))]/50">{albums.length ? albums.join(", ") : "No album"}</p>
    </div>
  );
}
