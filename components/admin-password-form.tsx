"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Panel } from "@/components/ui";

export function AdminPasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    if (newPassword !== confirmPassword) {
      setStatus("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? ""
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Password update failed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("Password updated.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Password update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="p-5">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-2 block text-sm font-medium">Current password</label>
          <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">New password</label>
          <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={12} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Confirm new password</label>
          <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Change password"}
          </Button>
          {status ? <p className="text-sm text-[hsl(var(--fg))]/65">{status}</p> : null}
        </div>
      </form>
    </Panel>
  );
}
