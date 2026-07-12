"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Panel } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [csrf, setCsrf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => setCsrf(data.csrf ?? ""));
  }, []);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "x-csrf-token": csrf },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
        next
      })
    });
    setPending(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Login failed");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <Panel className="mx-auto w-full max-w-md p-6">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-[hsl(var(--fg))]/60">Private access only. No public browsing.</p>
      </div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(new FormData(event.currentTarget));
        }}
      >
        <input type="hidden" name="csrf" value={csrf} />
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input name="password" type="password" autoComplete="current-password" required />
        </div>
        {error ? <p className="text-sm text-[hsl(var(--danger))]">{error}</p> : null}
        <Button type="submit" disabled={pending || !csrf} className="w-full">
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Panel>
  );
}
