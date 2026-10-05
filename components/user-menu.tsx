"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { Button, Panel } from "@/components/ui";

export function UserMenu({ user, compact = false }: { user: { name: string; email: string }; compact?: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": document.cookie.match(/fenjalbum_csrf=([^;]+)/)?.[1] ?? "" } });
    router.replace("/login");
    router.refresh();
  }

  return (
    <Panel className="flex items-center gap-3 px-3 py-2">
      <UserCircle2 className="h-5 w-5 text-[hsl(var(--fg))]/70" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{user.name}</div>
        <div className="truncate text-xs text-[hsl(var(--fg))]/60">{user.email}</div>
      </div>
      <Button variant="secondary" className={compact ? "ml-auto h-9 w-9 shrink-0 px-0" : "ml-2"} onClick={logout} aria-label="Log out">
        <LogOut className="h-4 w-4" />
        {compact ? <span className="sr-only">Logout</span> : "Logout"}
      </Button>
    </Panel>
  );
}
