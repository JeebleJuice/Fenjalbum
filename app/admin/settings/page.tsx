export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui";
import { AdminPasswordForm } from "@/components/admin-password-form";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();
  return (
    <AppShell user={user}>
      <Panel className="p-5">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-[hsl(var(--fg))]/65">
          This first pass keeps settings conservative. Add reverse proxy, backup, and storage changes via environment variables.
        </p>
      </Panel>
      <AdminPasswordForm />
    </AppShell>
  );
}
