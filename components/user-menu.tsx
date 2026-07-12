"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { Button, Panel } from "@/components/ui";

export function UserMenu({ user }: { user: { name: string; email: string } }) {
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
      <Button variant="secondary" className="ml-2" onClick={logout}>
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </Panel>
  );
}
