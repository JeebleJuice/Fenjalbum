"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Panel, Select } from "@/components/ui";

export function UserCreateForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? "" }, body: JSON.stringify(Object.fromEntries(form)) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false); setMessage(response.ok ? "Account created." : result.error ?? "Could not create account.");
    if (response.ok) { event.currentTarget.reset(); router.refresh(); }
  }
  return <Panel className="p-5"><h2 className="text-xl font-semibold">Add household account</h2><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submit}><Input name="name" required minLength={2} placeholder="Name"/><Input name="email" required type="email" placeholder="Email"/><Input name="password" required type="password" minLength={10} placeholder="Password (10+ characters)"/><Select name="role" defaultValue="USER"><option value="USER">Member</option><option value="ADMIN">Administrator</option></Select><div className="flex items-center gap-3 md:col-span-2"><Button disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>{message ? <span className="text-sm text-[hsl(var(--fg))]/65">{message}</span> : null}</div></form></Panel>;
}
