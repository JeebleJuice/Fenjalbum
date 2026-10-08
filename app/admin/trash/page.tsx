export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { AdminNavigation } from "@/components/admin-navigation";
import { Panel } from "@/components/ui";
import { TrashManager } from "@/components/trash-manager";

export default async function TrashPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();
  const media = await prisma.media.findMany({ where: { trashedAt: { not: null } }, orderBy: { trashedAt: "desc" } });
  return <AppShell user={user}><Panel className="p-5"><h1 className="text-3xl font-semibold tracking-tight">Trash</h1><p className="mt-2 text-sm text-[hsl(var(--fg))]/65">Restore mistakes or permanently remove originals when you are certain.</p></Panel><AdminNavigation /><TrashManager items={media.map((item) => ({ id: item.id, name: item.title ?? item.originalFilename, trashedAt: item.trashedAt!.toISOString() }))}/></AppShell>;
}
