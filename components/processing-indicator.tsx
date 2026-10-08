"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";

type ProcessingStatus = { queued: number; running: number; failed: number };

export function ProcessingIndicator() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/processing/status", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;
    setStatus(await response.json() as ProcessingStatus);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 5_000);
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  if (!status) return null;
  const active = status.queued + status.running;
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/55 px-3 py-2.5 text-xs" aria-live="polite">
      {active > 0 ? (
        <div className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-[hsl(var(--accent))]" /><span><strong>{active}</strong> {active === 1 ? "item" : "items"} processing on server</span></div>
      ) : status.failed > 0 ? (
        <div className="flex items-center gap-2 text-[hsl(var(--danger))]"><TriangleAlert className="h-3.5 w-3.5" /><span>{status.failed} failed processing</span></div>
      ) : (
        <div className="flex items-center gap-2 text-[hsl(var(--fg))]/55"><Check className="h-3.5 w-3.5" /><span>Processing queue clear</span></div>
      )}
    </div>
  );
}
