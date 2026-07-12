"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Panel, Textarea } from "@/components/ui";

export function AlbumCreateForm() {
  const router = useRouter();
  const [csrf, setCsrf] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Album creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Create album</h2>
        <p className="mt-1 text-sm text-[hsl(var(--fg))]/60">Make a curated collection for related photos and videos.</p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Summer trip" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A few lines about this album" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading || !csrf}>
            {loading ? "Creating..." : "Create album"}
          </Button>
          {status ? <p className="text-sm text-[hsl(var(--fg))]/65">{status}</p> : null}
        </div>
      </form>
    </Panel>
  );
}
