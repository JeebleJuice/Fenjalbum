"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, RotateCcw } from "lucide-react";
import { Button, Panel } from "@/components/ui";

type UploadStatus = { name: string; status: "pending" | "uploading" | "done" | "duplicate" | "error"; message?: string };

export function UploadDropzone({ albumId, returnTo }: { albumId?: string | null; returnTo?: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<UploadStatus[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/csrf", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { csrf?: string }) => {
        if (active) setCsrf(data.csrf ?? "");
      })
      .catch(() => {
        if (active) setCsrf("");
      });
    return () => {
      active = false;
    };
  }, []);

  async function sendFiles(files: FileList | File[]) {
    const uploadList = Array.from(files).map((file) => ({ name: file.name, status: "pending" as const }));
    setItems(uploadList);
    let hadError = false;
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, status: "uploading" } : item)));
      try {
        let token = csrf;
        if (!token) {
          const response = await fetch("/api/auth/csrf", { cache: "no-store" });
          const payload = (await response.json()) as { csrf?: string };
          token = payload.csrf ?? "";
          if (token) setCsrf(token);
        }
        if (!token) {
          throw new Error("CSRF token not ready");
        }
        const formData = new FormData();
        if (albumId) formData.append("albumId", albumId);
        formData.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          headers: { "x-csrf-token": token }
        });
        const raw = await response.text();
        let payload: { error?: string; results?: Array<{ duplicate?: boolean }> } = {};
        if (raw) {
          try {
            payload = JSON.parse(raw) as { error?: string; results?: Array<{ duplicate?: boolean }> };
          } catch {
            payload = { error: raw.slice(0, 200) };
          }
        }
        if (!response.ok) {
          hadError = true;
          setItems((current) =>
            current.map((item, itemIndex) => (itemIndex === index ? { ...item, status: "error", message: payload.error ?? "Upload failed" } : item))
          );
        } else {
          const result = Array.isArray(payload.results) ? payload.results[0] : null;
          if (result?.duplicate) {
            setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, status: "duplicate", message: "Duplicate detected" } : item)));
          } else {
            setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, status: "done" } : item)));
          }
        }
      } catch {
        hadError = true;
        setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, status: "error", message: "Network error" } : item)));
      }
    }
    if (!hadError) {
      if (returnTo) {
        router.replace(returnTo);
      } else {
        router.replace("/");
      }
      router.refresh();
    }
  }

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
          <p className="text-sm text-[hsl(var(--fg))]/60">Images and videos upload privately to your library.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" onClick={() => inputRef.current?.click()}>
            Choose files
          </Button>
          <Button type="button" variant="secondary" onClick={() => setItems([])}>
            <RotateCcw className="h-4 w-4" />
            Clear list
          </Button>
        </div>
        <p className="text-xs text-[hsl(var(--fg))]/50">Clear list only removes the local queue view.</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) sendFiles(event.target.files);
          }}
        />
        {items.length > 0 ? (
          <div className="mt-4 w-full space-y-2 text-left">
            {items.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] px-4 py-3 text-sm">
                <span className="truncate">{item.name}</span>
                <span className="text-xs uppercase tracking-wide text-[hsl(var(--fg))]/60">
                  {item.status}
                  {item.message ? `: ${item.message}` : ""}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
