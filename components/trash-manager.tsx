"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { formatDisplayDateTime } from "@/lib/date-format";
import { Button, Panel } from "@/components/ui";

export function TrashManager({ items }: { items: Array<{ id: string; name: string; trashedAt: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const csrf = () => document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? "";

  async function mutate(id: string, permanent: boolean) {
    if (permanent && !confirm("Permanently delete this original and its derivatives? This cannot be undone.")) return;
    setBusy(id);
    const response = await fetch(`/api/media/${id}${permanent ? "?permanent=1" : ""}`, {
      method: permanent ? "DELETE" : "PATCH",
      headers: { "x-csrf-token": csrf() }
    });
    setBusy("");
    if (response.ok) router.refresh();
  }

  if (!items.length) return <Panel className="p-6 text-sm text-[hsl(var(--fg))]/65">Trash is empty.</Panel>;
  return <div className="grid gap-3">{items.map((item) => <Panel key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><div className="font-medium">{item.name}</div><div className="text-xs text-[hsl(var(--fg))]/55">Trashed {formatDisplayDateTime(item.trashedAt)}</div></div><div className="flex gap-2"><Button variant="secondary" disabled={busy === item.id} onClick={() => void mutate(item.id, false)}><RotateCcw className="h-4 w-4"/> Restore</Button><Button variant="danger" disabled={busy === item.id} onClick={() => void mutate(item.id, true)}><Trash2 className="h-4 w-4"/> Delete forever</Button></div></Panel>)}</div>;
}
