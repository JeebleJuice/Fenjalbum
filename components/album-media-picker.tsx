"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Check, ChevronLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react";
import { Badge, Button, Input, Panel, Select } from "@/components/ui";
import { formatCaptureDate } from "@/lib/date-format";
import { paginationItems } from "@/lib/pagination";

type PickerItem = {
  id: string;
  title: string | null;
  originalFilename: string;
  mediaType: "PHOTO" | "VIDEO";
  thumbSrc: string | null;
  captureAt: string | null;
  uploadedAt: string;
  albumTitle: string | null;
  processingStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
};

type PickerResponse = {
  items: PickerItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  error?: string;
};

type PickerFilters = { q: string; dateFrom: string; dateTo: string; mediaType: string };
const EMPTY_FILTERS: PickerFilters = { q: "", dateFrom: "", dateTo: "", mediaType: "all" };

function pickerQuery(filters: PickerFilters, page = 1) {
  const query = new URLSearchParams();
  if (filters.q.trim()) query.set("q", filters.q.trim());
  if (filters.dateFrom) query.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) query.set("dateTo", filters.dateTo);
  if (filters.mediaType !== "all") query.set("mediaType", filters.mediaType);
  if (page > 1) query.set("page", String(page));
  return query;
}

export function AlbumMediaPicker({ albumId, albumTitle }: { albumId: string; albumTitle: string }) {
  const router = useRouter();
  const [csrf, setCsrf] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<PickerItem[]>([]);
  const [filters, setFilters] = useState<PickerFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<PickerFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(48);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingResults, setLoadingResults] = useState(true);
  const [selectingAll, setSelectingAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function applyResults(payload: PickerResponse) {
    setItems(payload.items);
    setPage(payload.page);
    setPageSize(payload.pageSize);
    setTotal(payload.total);
    setTotalPages(payload.totalPages);
  }

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/auth/csrf", { cache: "no-store", signal: controller.signal }).then((response) => response.json() as Promise<{ csrf?: string }>),
      fetch(`/api/albums/${albumId}/media`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
        const payload = await response.json() as PickerResponse;
        if (!response.ok) throw new Error(payload.error ?? "Could not load gallery media");
        return payload;
      })
    ])
      .then(([auth, results]) => {
        setCsrf(auth.csrf ?? "");
        applyResults(results);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus(error instanceof Error ? error.message : "Could not load gallery media");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingResults(false);
      });
    return () => controller.abort();
  }, [albumId]);

  const selectedCount = selected.size;
  const firstResult = total ? (page - 1) * pageSize + 1 : 0;
  const lastResult = Math.min(page * pageSize, total);
  const allShownSelected = useMemo(() => items.length > 0 && items.every((item) => selected.has(item.id)), [items, selected]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleShown() {
    setSelected((current) => {
      const next = new Set(current);
      for (const item of items) {
        if (allShownSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  }

  async function loadResults(nextPage: number, nextFilters: PickerFilters = appliedFilters) {
    setLoadingResults(true);
    setStatus(null);
    const query = pickerQuery(nextFilters, nextPage);
    try {
      const response = await fetch(`/api/albums/${albumId}/media?${query}`, { cache: "no-store" });
      const payload = await response.json() as PickerResponse;
      if (!response.ok) throw new Error(payload.error ?? "Could not search gallery media");
      applyResults(payload);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not search gallery media");
    } finally {
      setLoadingResults(false);
    }
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters(filters);
    void loadResults(1, filters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    void loadResults(1, EMPTY_FILTERS);
  }

  async function selectAllMatches() {
    setSelectingAll(true);
    setStatus(null);
    const query = pickerQuery(appliedFilters);
    query.set("selection", "all");
    try {
      const response = await fetch(`/api/albums/${albumId}/media?${query}`, { cache: "no-store" });
      const payload = await response.json() as { ids?: string[]; error?: string };
      if (!response.ok || !payload.ids) throw new Error(payload.error ?? "Could not select matching media");
      setSelected(new Set(payload.ids));
      setStatus(`Selected all ${payload.ids.length} matching items.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not select matching media");
    } finally {
      setSelectingAll(false);
    }
  }

  async function addSelected() {
    if (!selectedCount || !csrf) return;
    const count = selectedCount;
    setAdding(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/albums/${albumId}/media`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ mediaIds: Array.from(selected) })
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to add media");
      setSelected(new Set());
      await loadResults(page);
      setStatus(`Added ${count} item${count === 1 ? "" : "s"} to ${albumTitle}.`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to add media");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[hsl(var(--fg))]/55">From gallery</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Add existing media</h2>
          <p className="mt-1 max-w-2xl text-sm text-[hsl(var(--fg))]/65">Search every item not already in {albumTitle}. Selection stays active as you change pages.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{selectedCount} selected</Badge>
          <Button type="button" onClick={addSelected} disabled={!selectedCount || adding || !csrf}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add to album
          </Button>
        </div>
      </div>

      <form onSubmit={search} className="mt-4 space-y-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/45 p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search existing media</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--fg))]/45" />
            <Input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Search media" className="pl-10" />
          </label>
          <Select value={filters.mediaType} onChange={(event) => setFilters((current) => ({ ...current, mediaType: event.target.value }))} className="sm:w-40">
            <option value="all">Photos & videos</option><option value="photo">Photos only</option><option value="video">Videos only</option>
          </Select>
          <Button type="submit" disabled={loadingResults}>{loadingResults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search</Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1 text-xs font-medium text-[hsl(var(--fg))]/55"><span className="flex items-center gap-1.5"><CalendarRange className="h-3.5 w-3.5" /> Captured from</span><Input type="text" inputMode="numeric" value={filters.dateFrom} placeholder="dd/mm/yyyy or yyyy" aria-label="Captured from, day month year" onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} /></label>
          <label className="space-y-1 text-xs font-medium text-[hsl(var(--fg))]/55"><span className="flex items-center gap-1.5"><CalendarRange className="h-3.5 w-3.5" /> Captured through</span><Input type="text" inputMode="numeric" value={filters.dateTo} placeholder="dd/mm/yyyy or yyyy" aria-label="Captured through, day month year" onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} /></label>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-[hsl(var(--fg))]/60">{total ? `${firstResult}–${lastResult} of ${total} matches` : "No matches"}</span>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="h-8 px-3 text-xs" onClick={toggleShown} disabled={!items.length}>{allShownSelected ? "Deselect this page" : "Select this page"}</Button>
          <Button type="button" variant="secondary" className="h-8 px-3 text-xs" onClick={() => void selectAllMatches()} disabled={!total || selectingAll}>{selectingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Select all {total} matches</Button>
        </div>
      </div>
      {status ? <p className="mt-3 text-sm text-[hsl(var(--fg))]/65">{status}</p> : null}

      <div className="mt-3 grid gap-3 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {loadingResults ? (
          <div className="col-span-full flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--fg))]/45" /></div>
        ) : items.length ? items.map((item) => {
          const active = selected.has(item.id);
          return (
            <button key={item.id} type="button" onClick={() => toggle(item.id)} className={`group relative overflow-hidden rounded-[1.25rem] border text-left transition ${active ? "border-[hsl(var(--accent))] bg-[hsl(var(--card))] ring-2 ring-[hsl(var(--accent))]/30" : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:-translate-y-0.5"}`}>
              <div className="relative">
                {item.thumbSrc ? <img src={item.thumbSrc} alt={item.title ?? item.originalFilename} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-[hsl(var(--muted))]"><Loader2 className="h-5 w-5 animate-spin" /></div>}
                <Badge className="absolute left-2 top-2 border-white/20 bg-black/60 text-white">{item.mediaType === "PHOTO" ? "Photo" : "Video"}</Badge>
                <div className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border ${active ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-fg))]" : "border-white/30 bg-black/40 text-white"}`}>{active ? <Check className="h-4 w-4" /> : null}</div>
              </div>
              <div className="p-3"><h3 className="truncate text-sm font-semibold">{item.title ?? item.originalFilename}</h3><p className="mt-1 truncate text-xs text-[hsl(var(--fg))]/60">{formatCaptureDate(item.captureAt)} · {item.albumTitle ?? "No album"}</p></div>
            </button>
          );
        }) : <div className="col-span-full rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--fg))]/60">No media matches these filters.</div>}
      </div>

      {totalPages > 1 ? (
        <div className="no-scrollbar mt-4 flex items-center justify-center gap-1 overflow-x-auto">
          <Button type="button" variant="secondary" className="h-9 w-9 shrink-0 p-0" disabled={page <= 1 || loadingResults} onClick={() => void loadResults(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          {paginationItems(page, totalPages).map((item, index) => item === "ellipsis" ? <span key={`ellipsis-${index}`} className="w-8 shrink-0 text-center">…</span> : <Button key={item} type="button" variant={item === page ? "primary" : "secondary"} className="h-9 min-w-9 shrink-0 px-2" disabled={loadingResults} onClick={() => void loadResults(item)}>{item}</Button>)}
          <Button type="button" variant="secondary" className="h-9 w-9 shrink-0 p-0" disabled={page >= totalPages || loadingResults} onClick={() => void loadResults(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      ) : null}
    </Panel>
  );
}
