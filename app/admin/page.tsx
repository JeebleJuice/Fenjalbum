export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { AdminNavigation } from "@/components/admin-navigation";
import { Panel } from "@/components/ui";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

async function directorySize(root: string) {
  let total = 0;
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) total += await directorySize(full);
    else total += (await stat(full)).size;
  }
  return total;
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();
  const [mediaCount, albumCount, userCount, storage] = await Promise.all([
    prisma.media.count(),
    prisma.album.count(),
    prisma.user.count(),
    directorySize(env.MEDIA_ROOT)
  ]);
  return (
    <AppShell user={user}>
      <Panel className="p-5">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm text-[hsl(var(--fg))]/65">Operational controls for your private archive.</p>
      </Panel>
      <AdminNavigation />
      <div className="grid gap-4 md:grid-cols-4">
        <Panel className="p-4"><div className="text-xs uppercase text-[hsl(var(--fg))]/55">Media</div><div className="mt-2 text-2xl font-semibold">{mediaCount}</div></Panel>
        <Panel className="p-4"><div className="text-xs uppercase text-[hsl(var(--fg))]/55">Albums</div><div className="mt-2 text-2xl font-semibold">{albumCount}</div></Panel>
        <Panel className="p-4"><div className="text-xs uppercase text-[hsl(var(--fg))]/55">Users</div><div className="mt-2 text-2xl font-semibold">{userCount}</div></Panel>
        <Panel className="p-4"><div className="text-xs uppercase text-[hsl(var(--fg))]/55">Storage</div><div className="mt-2 text-2xl font-semibold">{(storage / 1024 / 1024 / 1024).toFixed(2)} GB</div></Panel>
      </div>
    </AppShell>
  );
}
