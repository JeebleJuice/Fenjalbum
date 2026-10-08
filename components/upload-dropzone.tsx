"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, RotateCcw, Square, UploadCloud } from "lucide-react";
import { Button, Panel, Select } from "@/components/ui";
import { runBoundedQueue } from "@/lib/bounded-queue";

type UploadState = "pending" | "uploading" | "waiting" | "done" | "duplicate" | "error";
type UploadStatus = { id: string; name: string; status: UploadState; message?: string };
type UploadPayload = { error?: string; retryAfterMs?: number; results?: Array<{ duplicate?: boolean }> };
type WakeLock = { release: () => Promise<void> };

const PARALLEL_UPLOADS = 3;
const MAX_TRANSIENT_RETRIES = 3;

function wait(delayMs: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, delayMs);
    function abort() {
      window.clearTimeout(timeout);
      reject(new DOMException("Upload cancelled", "AbortError"));
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function readPayload(response: Response): Promise<UploadPayload> {
  const raw = await response.text().catch(() => "");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as UploadPayload;
  } catch {
    return { error: raw.slice(0, 200) };
  }
}

function retryDelay(response: Response, payload: UploadPayload) {
  const headerSeconds = Number(response.headers.get("retry-after"));
  const requested = Number.isFinite(headerSeconds) && headerSeconds > 0 ? headerSeconds * 1_000 : payload.retryAfterMs;
  return Math.min(60_000, Math.max(1_000, requested ?? 2_000));
}

export function UploadDropzone({
  albumId,
  albums,
  returnTo
}: {
  albumId?: string | null;
  albums: Array<{ id: string; title: string }>;
  returnTo?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);
  const filesRef = useRef<File[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const uploadingRef = useRef(false);
  const csrfRef = useRef("");
  const targetAlbumRef = useRef(albumId ?? "");
  const [targetAlbumId, setTargetAlbumId] = useState(albumId ?? "");
  const [items, setItems] = useState<UploadStatus[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/csrf", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { csrf?: string }) => {
        if (active) csrfRef.current = data.csrf ?? "";
      })
      .catch(() => {
        if (active) csrfRef.current = "";
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isUploading) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isUploading]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  function updateItem(index: number, update: Partial<UploadStatus>) {
    setItems((current) => {
      if (!current[index]) return current;
      const next = [...current];
      next[index] = { ...next[index], ...update };
      return next;
    });
  }

  async function csrfToken() {
    if (csrfRef.current) return csrfRef.current;
    const response = await fetch("/api/auth/csrf", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not start a secure upload session");
    const payload = (await response.json()) as { csrf?: string };
    if (!payload.csrf) throw new Error("Could not start a secure upload session");
    csrfRef.current = payload.csrf;
    return payload.csrf;
  }

  async function uploadOne(index: number, token: string, signal: AbortSignal) {
    const file = filesRef.current[index];
    if (!file) return false;
    let transientAttempts = 0;

    while (!signal.aborted) {
      updateItem(index, { status: "uploading", message: undefined });
      const formData = new FormData();
      if (targetAlbumRef.current) formData.append("albumId", targetAlbumRef.current);
      formData.append("file", file);

      let response: Response;
      try {
        response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          headers: { "x-csrf-token": token },
          signal
        });
      } catch {
        if (signal.aborted) return false;
        transientAttempts += 1;
        if (transientAttempts > MAX_TRANSIENT_RETRIES) {
          updateItem(index, { status: "error", message: "Network error after automatic retries" });
          return false;
        }
        const delay = 1_000 * 2 ** (transientAttempts - 1);
        updateItem(index, { status: "waiting", message: `Connection interrupted; retrying in ${delay / 1_000}s` });
        await wait(delay, signal).catch(() => undefined);
        continue;
      }

      const payload = await readPayload(response);
      if (response.ok) {
        const result = Array.isArray(payload.results) ? payload.results[0] : null;
        updateItem(index, result?.duplicate
          ? { status: "duplicate", message: "Already in your library" }
          : { status: "done", message: undefined });
        return true;
      }

      if (response.status === 429) {
        const delay = retryDelay(response, payload);
        updateItem(index, { status: "waiting", message: `Server busy; retrying in ${Math.ceil(delay / 1_000)}s` });
        await wait(delay, signal).catch(() => undefined);
        continue;
      }

      if (response.status >= 500 && transientAttempts < MAX_TRANSIENT_RETRIES) {
        transientAttempts += 1;
        const delay = 1_000 * 2 ** (transientAttempts - 1);
        updateItem(index, { status: "waiting", message: `Server error; retrying in ${delay / 1_000}s` });
        await wait(delay, signal).catch(() => undefined);
        continue;
      }

      updateItem(index, { status: "error", message: payload.error ?? `Upload failed (${response.status})` });
      return false;
    }
    return false;
  }

  async function runQueue(indexes: number[]) {
    if (uploadingRef.current || indexes.length === 0) return;
    uploadingRef.current = true;
    setIsUploading(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    let wakeLock: WakeLock | null = null;
    let allSucceeded = true;

    try {
      const navigatorWithWakeLock = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLock> } };
      wakeLock = await navigatorWithWakeLock.wakeLock?.request("screen").catch(() => null) ?? null;
      const token = await csrfToken();
      await runBoundedQueue(indexes, PARALLEL_UPLOADS, async (index) => {
        if (controller.signal.aborted) return;
        const succeeded = await uploadOne(index, token, controller.signal);
        if (!succeeded) allSucceeded = false;
      });
    } catch (error) {
      allSucceeded = false;
      const message = error instanceof Error ? error.message : "Could not start uploads";
      const queued = new Set(indexes);
      setItems((current) => current.map((item, index) =>
        queued.has(index) && (item.status === "pending" || item.status === "uploading" || item.status === "waiting")
          ? { ...item, status: "error", message }
          : item
      ));
    } finally {
      await wakeLock?.release().catch(() => undefined);
      controllerRef.current = null;
      uploadingRef.current = false;
      setIsUploading(false);
    }

    if (allSucceeded && !controller.signal.aborted) {
      router.replace(returnTo ?? (targetAlbumRef.current ? `/albums/${targetAlbumRef.current}` : "/"));
      router.refresh();
    }
  }

  function sendFiles(files: FileList | File[]) {
    if (uploadingRef.current) return;
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) return;
    filesRef.current = selectedFiles;
    setItems(selectedFiles.map((file, index) => ({
      id: `${index}-${file.name}-${file.lastModified}`,
      name: file.name,
      status: "pending"
    })));
    void runQueue(selectedFiles.map((_, index) => index));
  }

  function cancelUploads() {
    controllerRef.current?.abort();
    setItems((current) => current.map((item) =>
      item.status === "pending" || item.status === "uploading" || item.status === "waiting"
        ? { ...item, status: "error", message: "Cancelled—safe to retry" }
        : item
    ));
  }

  function retryFailed() {
    const failedIndexes = items.flatMap((item, index) => item.status === "error" ? [index] : []);
    setItems((current) => current.map((item) => item.status === "error" ? { ...item, status: "pending", message: undefined } : item));
    void runQueue(failedIndexes);
  }

  const finished = items.filter((item) => item.status === "done" || item.status === "duplicate" || item.status === "error").length;
  const succeeded = items.filter((item) => item.status === "done").length;
  const duplicates = items.filter((item) => item.status === "duplicate").length;
  const failed = items.filter((item) => item.status === "error").length;
  const progress = items.length > 0 ? Math.round((finished / items.length) * 100) : 0;

  return (
    <Panel
      className={dragOver ? "border-[hsl(var(--accent))] p-6" : "p-6"}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        if (event.dataTransfer.files.length > 0) sendFiles(event.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
          <UploadCloud className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Drop files here</h2>
          <p className="text-sm text-[hsl(var(--fg))]/60">Large photo selections are queued three at a time. Videos use a separate iPhone-safe picker.</p>
        </div>
        <label className="w-full max-w-md text-left text-xs font-medium uppercase tracking-[0.16em] text-[hsl(var(--fg))]/55">
          Upload destination
          <Select
            className="mt-2 normal-case tracking-normal"
            value={targetAlbumId}
            disabled={isUploading}
            onChange={(event) => {
              targetAlbumRef.current = event.target.value;
              setTargetAlbumId(event.target.value);
            }}
          >
            <option value="">Main gallery (no album)</option>
            {albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}
          </Select>
        </label>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()}>
            Choose photos
          </Button>
          <Button type="button" disabled={isUploading} variant="secondary" onClick={() => videoInputRef.current?.click()}>Choose one video</Button>
          <Button type="button" disabled={isUploading} variant="secondary" onClick={() => filesInputRef.current?.click()}>Choose from Files</Button>
          <Button type="button" disabled={isUploading} variant="secondary" onClick={() => folderRef.current?.click()}>Choose entire folder</Button>
          {isUploading ? (
            <Button type="button" variant="danger" onClick={cancelUploads}>
              <Square className="h-4 w-4" />
              Stop uploads
            </Button>
          ) : failed > 0 ? (
            <Button type="button" variant="secondary" onClick={retryFailed}>
              <RefreshCw className="h-4 w-4" />
              Retry {failed} failed
            </Button>
          ) : null}
          <Button type="button" disabled={isUploading} variant="secondary" onClick={() => { filesRef.current = []; setItems([]); }}>
            <RotateCcw className="h-4 w-4" />
            Clear list
          </Button>
        </div>
        <p className="max-w-xl text-xs leading-5 text-[hsl(var(--fg))]/50">
          Keep this page open only while the original files transfer. When transfer finishes, Fenjalbum takes you back automatically and the server continues thumbnails, metadata, and video processing while you browse or minimize the app.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) sendFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) sendFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={filesInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) sendFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={(node) => { folderRef.current = node; if (node) { node.setAttribute("webkitdirectory", ""); node.setAttribute("directory", ""); } }}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => { if (event.target.files) sendFiles(event.target.files); event.target.value = ""; }}
        />
        {items.length > 0 ? (
          <div className="mt-4 w-full space-y-2 text-left" aria-live="polite">
            <div className="space-y-2 rounded-2xl bg-[hsl(var(--muted))] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{finished} of {items.length} finished</span>
                <span>{succeeded} transferred · {duplicates} duplicates{failed > 0 ? ` · ${failed} failed` : ""} · {progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--card))]">
                <div className="h-full rounded-full bg-[hsl(var(--accent))] transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {items.slice(0, 100).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border))] px-4 py-3 text-sm">
                <span className="min-w-0 truncate">{item.name}</span>
                <span className="shrink-0 text-right text-xs uppercase tracking-wide text-[hsl(var(--fg))]/60">
                  {item.status}
                  {item.message ? <span className="block max-w-56 normal-case tracking-normal">{item.message}</span> : null}
                </span>
              </div>
            ))}
            {items.length > 100 ? <p className="text-center text-xs text-[hsl(var(--fg))]/55">Showing the first 100 files; all {items.length} files remain queued.</p> : null}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
