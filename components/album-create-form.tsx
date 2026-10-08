"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button, Input, Panel, Textarea } from "@/components/ui";

export function AlbumCreateForm() {
  const router = useRouter();
  const [csrf, setCsrf] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/csrf", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { csrf?: string }) => setCsrf(data.csrf ?? ""))
      .catch(() => setCsrf(""));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "x-csrf-token": csrf
        },
        body: formData
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Album creation failed");
      setTitle("");
      setDescription("");
      setStatus("Album created.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Album creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="p-3 sm:p-4">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">Albums</h2><p className="text-sm text-[hsl(var(--fg))]/55">Create a collection when you need one.</p></div>
          <Button type="button" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New album</Button>
        </div>
      ) : (
        <form className="grid gap-3 lg:grid-cols-[minmax(12rem,.7fr)_minmax(16rem,1.3fr)_auto] lg:items-start" onSubmit={submit}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Album title" aria-label="Album title" required autoFocus />
          <Textarea className="min-h-11 lg:h-11" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" aria-label="Album description" />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !csrf}>{loading ? "Creating..." : "Create"}</Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} aria-label="Cancel"><X className="h-4 w-4" /></Button>
          </div>
        </form>
      )}
      {status ? <p className="mt-2 text-sm text-[hsl(var(--fg))]/65">{status}</p> : null}
    </Panel>
  );
}
