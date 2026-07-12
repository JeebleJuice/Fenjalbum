"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function RetryJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function retry() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/retry`, {
        method: "POST",
        headers: {
          "x-csrf-token": document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? ""
        }
      });
      if (!response.ok) throw new Error("Retry failed");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={retry} disabled={loading}>
      {loading ? "Retrying..." : "Retry"}
    </Button>
  );
}
